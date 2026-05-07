import { FastifyInstance } from "fastify";
import { StatusAtendimento } from "@prisma/client";
import { prisma } from "../lib/prisma";

function faltamMenosDeDoisDias(data: Date) {
  const agora = new Date();
  const diferencaEmMs = data.getTime() - agora.getTime();
  const diferencaEmDias = diferencaEmMs / (1000 * 60 * 60 * 24);

  return diferencaEmDias < 2;
}

export async function atendimentosRoutes(app: FastifyInstance) {
  app.post("/atendimentos", async (request, reply) => {
    const {
      clienteId,
      profissionalId,
      procedimentoIds,
      data,
      observacoes,
    } = request.body as {
      clienteId: string;
      profissionalId: string;
      procedimentoIds: string[];
      data: string;
      observacoes?: string;
    };

    if (!clienteId || !profissionalId || !data || !procedimentoIds || procedimentoIds.length === 0) {
      return reply.status(400).send({
        message: "Cliente, profissional, data e ao menos um procedimento são obrigatórios",
      });
    }

    const dataAtendimento = new Date(data);

    if (Number.isNaN(dataAtendimento.getTime())) {
      return reply.status(400).send({
        message: "Data inválida",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return reply.status(404).send({
        message: "Cliente não encontrado",
      });
    }

    const profissional = await prisma.profissional.findUnique({
      where: { id: profissionalId },
    });

    if (!profissional || !profissional.ativo) {
      return reply.status(404).send({
        message: "Profissional não encontrado ou inativo",
      });
    }

    const procedimentos = await prisma.procedimento.findMany({
      where: {
        id: {
          in: procedimentoIds,
        },
        ativo: true,
      },
    });

    if (procedimentos.length !== procedimentoIds.length) {
      return reply.status(400).send({
        message: "Um ou mais procedimentos não existem ou estão inativos",
      });
    }

    const conflito = await prisma.atendimento.findFirst({
      where: {
        profissionalId,
        data: dataAtendimento,
        status: {
          not: StatusAtendimento.CANCELADO,
        },
      },
    });

    if (conflito) {
      return reply.status(400).send({
        message: "Este profissional já possui atendimento nesse horário",
      });
    }

    const inicioSugestao = new Date(dataAtendimento);
    inicioSugestao.setDate(inicioSugestao.getDate() - 7);

    const fimSugestao = new Date(dataAtendimento);
    fimSugestao.setDate(fimSugestao.getDate() + 7);

    const atendimentoProximo = await prisma.atendimento.findFirst({
      where: {
        clienteId,
        status: {
          not: StatusAtendimento.CANCELADO,
        },
        data: {
          gte: inicioSugestao,
          lte: fimSugestao,
        },
      },
      orderBy: {
        data: "asc",
      },
    });

    const valorTotal = procedimentos.reduce((total, procedimento) => {
      return total + procedimento.preco;
    }, 0);

    const atendimento = await prisma.atendimento.create({
      data: {
        clienteId,
        profissionalId,
        data: dataAtendimento,
        observacoes,
        valorTotal,
        procedimentos: {
          create: procedimentoIds.map((procedimentoId) => ({
            procedimentoId,
          })),
        },
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });

    return reply.status(201).send({
      atendimento,
      sugestao: atendimentoProximo
        ? {
            message:
              "Este cliente possui outro atendimento próximo. Considere ajustar a agenda para otimizar o retorno.",
            dataSugerida: atendimentoProximo.data,
          }
        : null,
    });
  });

  app.get("/atendimentos", async () => {
    return prisma.atendimento.findMany({
      orderBy: {
        data: "asc",
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });
  });

  app.get("/atendimentos/filtro", async (request, reply) => {
    const { dataInicio, dataFim } = request.query as {
      dataInicio?: string;
      dataFim?: string;
    };

    if (!dataInicio || !dataFim) {
      return reply.status(400).send({
        message: "Informe dataInicio e dataFim",
      });
    }

    return prisma.atendimento.findMany({
      where: {
        data: {
          gte: new Date(`${dataInicio}T00:00:00.000Z`),
          lte: new Date(`${dataFim}T23:59:59.999Z`),
        },
      },
      orderBy: {
        data: "asc",
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });
  });

  app.put("/atendimentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data, profissionalId, observacoes } = request.body as {
      data?: string;
      profissionalId?: string;
      observacoes?: string;
    };

    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
    });

    if (!atendimento) {
      return reply.status(404).send({
        message: "Atendimento não encontrado",
      });
    }

    if (atendimento.status === StatusAtendimento.CANCELADO) {
      return reply.status(400).send({
        message: "Não é possível alterar um atendimento cancelado",
      });
    }

    if (faltamMenosDeDoisDias(new Date(atendimento.data))) {
      return reply.status(400).send({
        message:
          "Não é possível alterar atendimento com menos de 2 dias de antecedência.",
      });
    }

    const novaData = data ? new Date(data) : atendimento.data;
    const novoProfissionalId = profissionalId ?? atendimento.profissionalId;

    const conflito = await prisma.atendimento.findFirst({
      where: {
        id: {
          not: id,
        },
        profissionalId: novoProfissionalId,
        data: novaData,
        status: {
          not: StatusAtendimento.CANCELADO,
        },
      },
    });

    if (conflito) {
      return reply.status(400).send({
        message: "Este profissional já possui outro atendimento nesse horário",
      });
    }

    const atendimentoAtualizado = await prisma.atendimento.update({
      where: { id },
      data: {
        data: novaData,
        profissionalId: novoProfissionalId,
        observacoes,
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });

    return atendimentoAtualizado;
  });

  app.patch("/atendimentos/:id/cancelar", async (request, reply) => {
    const { id } = request.params as { id: string };

    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
    });

    if (!atendimento) {
      return reply.status(404).send({
        message: "Atendimento não encontrado",
      });
    }

    if (atendimento.status === StatusAtendimento.CANCELADO) {
      return reply.status(400).send({
        message: "Este atendimento já está cancelado",
      });
    }

    if (faltamMenosDeDoisDias(new Date(atendimento.data))) {
      return reply.status(400).send({
        message:
          "Não é possível cancelar atendimento com menos de 2 dias de antecedência.",
      });
    }

    const atendimentoCancelado = await prisma.atendimento.update({
      where: { id },
      data: {
        status: StatusAtendimento.CANCELADO,
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });

    return atendimentoCancelado;
  });

  app.patch("/atendimentos/:id/confirmar", async (request, reply) => {
    const { id } = request.params as { id: string };

    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
    });

    if (!atendimento) {
      return reply.status(404).send({
        message: "Atendimento não encontrado",
      });
    }

    if (atendimento.status === StatusAtendimento.CANCELADO) {
      return reply.status(400).send({
        message: "Não é possível confirmar um atendimento cancelado",
      });
    }

    const atendimentoConfirmado = await prisma.atendimento.update({
      where: { id },
      data: {
        status: StatusAtendimento.CONFIRMADO,
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });

    return atendimentoConfirmado;
  });

  app.patch("/atendimentos/:id/realizar", async (request, reply) => {
    const { id } = request.params as { id: string };

    const atendimento = await prisma.atendimento.findUnique({
      where: { id },
    });

    if (!atendimento) {
      return reply.status(404).send({
        message: "Atendimento não encontrado",
      });
    }

    if (atendimento.status === StatusAtendimento.CANCELADO) {
      return reply.status(400).send({
        message: "Não é possível realizar um atendimento cancelado",
      });
    }

    const atendimentoRealizado = await prisma.atendimento.update({
      where: { id },
      data: {
        status: StatusAtendimento.REALIZADO,
      },
      include: {
        cliente: true,
        profissional: true,
        procedimentos: {
          include: {
            procedimento: true,
          },
        },
      },
    });

    return atendimentoRealizado;
  });
}