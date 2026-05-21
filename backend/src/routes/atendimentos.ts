import { FastifyInstance } from "fastify";
import { StatusAtendimento } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/adminMiddleware";

function faltamMenosDeDoisDias(data: Date) {
  const agora = new Date();
  const diferencaEmMs = data.getTime() - agora.getTime();
  const diferencaEmDias = diferencaEmMs / (1000 * 60 * 60 * 24);

  return diferencaEmDias < 2;
}

async function buscarClienteDoUsuario(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
  });

  if (!usuario) {
    return null;
  }

  return prisma.cliente.findUnique({
    where: { email: usuario.email },
  });
}

export async function atendimentosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/public/horarios-disponiveis", async (request, reply) => {
  const { profissionalId, data, procedimentoIds } = request.query as {
    profissionalId?: string;
    data?: string;
    procedimentoIds?: string;
  };

  if (!profissionalId || !data) {
    return reply.status(400).send({
      message: "Profissional e data são obrigatórios",
    });
  }

  const profissional = await prisma.profissional.findUnique({
    where: {
      id: profissionalId,
    },
  });

  if (!profissional) {
    return reply.status(404).send({
      message: "Profissional não encontrado",
    });
  }

  const dataSelecionada = new Date(`${data}T00:00:00`);

  const diaSemana = dataSelecionada.getDay();

  const diasPermitidos = profissional.diasAtivos
    .split(",")
    .map(Number);

  if (!diasPermitidos.includes(diaSemana)) {
    return [];
  }

  const procedimentosSelecionados = procedimentoIds
    ? await prisma.procedimento.findMany({
        where: {
          id: {
            in: procedimentoIds.split(",").filter(Boolean),
          },
        },
      })
    : [];

  const duracaoCalculada = procedimentosSelecionados.reduce(
    (total, procedimento) => total + procedimento.duracao,
    0
  );

  const duracaoTotal = duracaoCalculada > 0
    ? duracaoCalculada
    : 60;

  const inicioDia = new Date(`${data}T00:00:00`);
  const fimDia = new Date(`${data}T23:59:59`);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      profissionalId,
      status: {
        not: StatusAtendimento.CANCELADO,
      },
      data: {
        gte: inicioDia,
        lte: fimDia,
      },
    },
    include: {
      procedimentos: {
        include: {
          procedimento: true,
        },
      },
    },
  });

  const [horaInicio, minutoInicio] =
    profissional.horaInicio.split(":").map(Number);

  const [horaFim, minutoFim] =
    profissional.horaFim.split(":").map(Number);

  const inicioExpediente = new Date(`${data}T00:00:00`);
  inicioExpediente.setHours(horaInicio, minutoInicio, 0, 0);

  const fimExpediente = new Date(`${data}T00:00:00`);
  fimExpediente.setHours(horaFim, minutoFim, 0, 0);

  let inicioIntervalo: Date | null = null;
  let fimIntervalo: Date | null = null;

  if (
    profissional.intervaloInicio &&
    profissional.intervaloFim
  ) {
    const [horaIntervaloInicio, minutoIntervaloInicio] =
      profissional.intervaloInicio.split(":").map(Number);

    const [horaIntervaloFim, minutoIntervaloFim] =
      profissional.intervaloFim.split(":").map(Number);

    inicioIntervalo = new Date(`${data}T00:00:00`);
    inicioIntervalo.setHours(
      horaIntervaloInicio,
      minutoIntervaloInicio,
      0,
      0
    );

    fimIntervalo = new Date(`${data}T00:00:00`);
    fimIntervalo.setHours(
      horaIntervaloFim,
      minutoIntervaloFim,
      0,
      0
    );
  }

  const horariosDisponiveis: string[] = [];

  const horarioAtual = new Date(inicioExpediente);

  while (horarioAtual < fimExpediente) {
    const inicioNovo = new Date(horarioAtual);

    const fimNovo = new Date(
      inicioNovo.getTime() + duracaoTotal * 60000
    );

    if (fimNovo > fimExpediente) {
      break;
    }

    const dentroDoIntervalo =
      inicioIntervalo &&
      fimIntervalo &&
      inicioNovo < fimIntervalo &&
      fimNovo > inicioIntervalo;

    if (dentroDoIntervalo) {
      horarioAtual.setMinutes(horarioAtual.getMinutes() + 30);
      continue;
    }

    const temConflito = atendimentos.some((atendimento) => {
      const inicioExistente = new Date(atendimento.data);

      const duracaoExistente =
        atendimento.procedimentos.reduce(
          (total, item) => total + item.procedimento.duracao,
          0
        ) || 60;

      const fimExistente = new Date(
        inicioExistente.getTime() +
          duracaoExistente * 60000
      );

      return (
        inicioNovo < fimExistente &&
        fimNovo > inicioExistente
      );
    });

    if (!temConflito) {
      horariosDisponiveis.push(
        inicioNovo.toISOString().substring(11, 16)
      );
    }

    horarioAtual.setMinutes(horarioAtual.getMinutes() + 30);
  }

  return horariosDisponiveis;
});
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

    if (
      !clienteId ||
      !profissionalId ||
      !data ||
      !procedimentoIds ||
      procedimentoIds.length === 0
    ) {
      return reply.status(400).send({
        message:
          "Cliente, profissional, data e ao menos um procedimento são obrigatórios",
      });
    }

    if (request.user.role !== "ADMIN") {
      const clienteDoUsuario = await buscarClienteDoUsuario(request.user.id);

      if (!clienteDoUsuario || clienteDoUsuario.id !== clienteId) {
        return reply.status(403).send({
          message: "Você só pode criar agendamentos para o seu próprio cadastro.",
        });
      }
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
app.get("/meus-agendamentos", async (request, reply) => {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: request.user.id,
    },
  });

  if (!usuario) {
    return reply.status(404).send({
      message: "Usuário não encontrado",
    });
  }

  const cliente = await prisma.cliente.findUnique({
    where: {
      email: usuario.email,
    },
  });

  if (!cliente) {
    return reply.status(404).send({
      message: "Cliente não encontrado",
    });
  }

  const agendamentos = await prisma.atendimento.findMany({
    where: {
      clienteId: cliente.id,
    },
    orderBy: {
      data: "desc",
    },
    include: {
      profissional: true,
      procedimentos: {
        include: {
          procedimento: true,
        },
      },
    },
  });

  return agendamentos;
});
  app.get("/atendimentos", { preHandler: adminMiddleware }, async () => {
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

  app.get(
    "/atendimentos/filtro",
    { preHandler: adminMiddleware },
    async (request, reply) => {
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
    }
  );

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

  if (request.user.role !== "ADMIN") {
    const clienteDoUsuario = await buscarClienteDoUsuario(request.user.id);

    if (!clienteDoUsuario || clienteDoUsuario.id !== atendimento.clienteId) {
      return reply.status(403).send({
        message: "Você só pode remarcar seus próprios agendamentos.",
      });
    }
  }

  if (atendimento.status === StatusAtendimento.CANCELADO) {
    return reply.status(400).send({
      message: "Não é possível alterar um atendimento cancelado",
    });
  }

  if (atendimento.status === StatusAtendimento.REALIZADO) {
    return reply.status(400).send({
      message: "Não é possível alterar um atendimento já realizado",
    });
  }

  if (faltamMenosDeDoisDias(new Date(atendimento.data))) {
    return reply.status(400).send({
      message:
        "Não é possível alterar atendimento com menos de 2 dias de antecedência.",
    });
  }

  const novaData = data ? new Date(data) : atendimento.data;

  if (Number.isNaN(novaData.getTime())) {
    return reply.status(400).send({
      message: "Data inválida",
    });
  }

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
    include: {
      cliente: true,
    },
  });

  if (!atendimento) {
    return reply.status(404).send({
      message: "Atendimento não encontrado",
    });
  }

  if (request.user.role !== "ADMIN") {
    const clienteDoUsuario = await buscarClienteDoUsuario(request.user.id);

    if (!clienteDoUsuario || clienteDoUsuario.id !== atendimento.clienteId) {
      return reply.status(403).send({
        message: "Você só pode cancelar seus próprios agendamentos.",
      });
    }
  }

  if (atendimento.status === StatusAtendimento.CANCELADO) {
    return reply.status(400).send({
      message: "Este atendimento já está cancelado",
    });
  }

  if (atendimento.status === StatusAtendimento.REALIZADO) {
    return reply.status(400).send({
      message: "Não é possível cancelar um atendimento já realizado",
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

app.patch(
  "/atendimentos/:id/confirmar",
  { preHandler: adminMiddleware },
  async (request, reply) => {
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
  }
);

app.patch(
  "/atendimentos/:id/realizar",
  { preHandler: adminMiddleware },
  async (request, reply) => {
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
  }
);
}  