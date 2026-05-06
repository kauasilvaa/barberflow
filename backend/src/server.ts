import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { prisma } from "./lib/prisma";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

function faltamMenosDeDoisDias(data: Date) {
  const agora = new Date();
  const diferencaEmMs = data.getTime() - agora.getTime();
  const diferencaEmDias = diferencaEmMs / (1000 * 60 * 60 * 24);

  return diferencaEmDias < 2;
}

function obterIntervaloSemana(data: Date) {
  const inicio = new Date(data);
  const diaSemana = inicio.getDay();

  inicio.setDate(inicio.getDate() - diaSemana);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  return { inicio, fim };
}

// Health check
app.get("/health", async () => {
  return {
    status: "ok",
    message: "API Leila Salão de Beleza funcionando",
  };
});

// Criar cliente
app.post("/clientes", async (request, reply) => {
  const { nome, email, telefone } = request.body as {
    nome: string;
    email: string;
    telefone: string;
  };

  if (!nome || !email || !telefone) {
    return reply.status(400).send({
      message: "Nome, email e telefone são obrigatórios",
    });
  }

  const clienteExistente = await prisma.cliente.findUnique({
    where: { email },
  });

  if (clienteExistente) {
    return reply.status(400).send({
      message: "Já existe um cliente cadastrado com este email",
    });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      email,
      telefone,
    },
  });

  return reply.status(201).send(cliente);
});

// Listar clientes
app.get("/clientes", async () => {
  return prisma.cliente.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
});

// Atualizar cliente
app.put("/clientes/:id", async (request) => {
  const { id } = request.params as { id: string };
  const { nome, email, telefone } = request.body as {
    nome?: string;
    email?: string;
    telefone?: string;
  };

  return prisma.cliente.update({
    where: { id },
    data: {
      nome,
      email,
      telefone,
    },
  });
});

// Deletar cliente
app.delete("/clientes/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  await prisma.cliente.delete({
    where: { id },
  });

  return reply.status(204).send();
});

// Criar serviço
app.post("/servicos", async (request, reply) => {
  const { nome, preco, duracao } = request.body as {
    nome: string;
    preco: number;
    duracao: number;
  };

  if (!nome || preco <= 0 || duracao <= 0) {
    return reply.status(400).send({
      message: "Nome, preço e duração válidos são obrigatórios",
    });
  }

  const servico = await prisma.servico.create({
    data: {
      nome,
      preco,
      duracao,
    },
  });

  return reply.status(201).send(servico);
});

// Listar serviços
app.get("/servicos", async () => {
  return prisma.servico.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
});

// Criar agendamento
app.post("/agendamentos", async (request, reply) => {
  const { clienteId, data, servicoIds } = request.body as {
    clienteId: string;
    data: string;
    servicoIds: string[];
  };

  if (!clienteId || !data || !servicoIds || servicoIds.length === 0) {
    return reply.status(400).send({
      message: "Cliente, data e ao menos um serviço são obrigatórios",
    });
  }

  const dataAgendamento = new Date(data);

  if (Number.isNaN(dataAgendamento.getTime())) {
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

  const conflito = await prisma.agendamento.findFirst({
    where: {
      data: dataAgendamento,
      status: {
        not: "CANCELADO",
      },
    },
  });

  if (conflito) {
    return reply.status(400).send({
      message: "Já existe um agendamento nesse horário",
    });
  }

  const inicioSugestao = new Date(dataAgendamento);
  inicioSugestao.setDate(inicioSugestao.getDate() - 7);

    const fimSugestao = new Date(dataAgendamento);
    fimSugestao.setDate(fimSugestao.getDate() + 7);

        const agendamentoNaMesmaSemana = await prisma.agendamento.findFirst({
          where: {
            clienteId,
            status: {
            not: "CANCELADO",
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

  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId,
      data: dataAgendamento,
      servicos: {
        create: servicoIds.map((servicoId) => ({
          servicoId,
        })),
      },
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return reply.status(201).send({
    agendamento,
    sugestao: agendamentoNaMesmaSemana
      ? {
          message:
            "Existe outro agendamento deste cliente na mesma semana. Considere manter uma data próxima.",
          dataSugerida: agendamentoNaMesmaSemana.data,
        }
      : null,
  });
});

// Listar agendamentos
app.get("/agendamentos", async () => {
  return prisma.agendamento.findMany({
    orderBy: {
      data: "asc",
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });
});

app.get("/dashboard", async () => {
  const total = await prisma.agendamento.count();

  const confirmados = await prisma.agendamento.count({
    where: { status: "CONFIRMADO" },
  });

  const cancelados = await prisma.agendamento.count({
    where: { status: "CANCELADO" },
  });

  const pendentes = await prisma.agendamento.count({
    where: { status: "PENDENTE" },
  });

  return {
    total,
    confirmados,
    cancelados,
    pendentes,
  };
});

// Filtrar agendamentos por período
app.get("/agendamentos/filtro", async (request, reply) => {
  const { dataInicio, dataFim } = request.query as {
    dataInicio?: string;
    dataFim?: string;
  };

  if (!dataInicio || !dataFim) {
    return reply.status(400).send({
      message: "Informe dataInicio e dataFim",
    });
  }

  return prisma.agendamento.findMany({
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
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });
});

// Alterar data do agendamento com regra dos 2 dias
app.put("/agendamentos/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { data } = request.body as { data: string };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
  });

  if (!agendamento) {
    return reply.status(404).send({
      message: "Agendamento não encontrado",
    });
  }

  if (agendamento.status === "CANCELADO") {
    return reply.status(400).send({
      message: "Não é possível alterar um agendamento cancelado",
    });
  }

  if (faltamMenosDeDoisDias(new Date(agendamento.data))) {
    return reply.status(400).send({
      message:
        "Não é possível alterar agendamento com menos de 2 dias de antecedência. Entre em contato por telefone.",
    });
  }

  const novaData = new Date(data);

  const conflito = await prisma.agendamento.findFirst({
    where: {
      id: {
        not: id,
      },
      data: novaData,
      status: {
        not: "CANCELADO",
      },
    },
  });

  if (conflito) {
    return reply.status(400).send({
      message: "Já existe outro agendamento nesse horário",
    });
  }

  const agendamentoAtualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      data: novaData,
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return agendamentoAtualizado;
});

// Cancelar agendamento com regra dos 2 dias
app.patch("/agendamentos/:id/cancelar", async (request, reply) => {
  const { id } = request.params as { id: string };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
  });

  if (!agendamento) {
    return reply.status(404).send({
      message: "Agendamento não encontrado",
    });
  }

  if (agendamento.status === "CANCELADO") {
    return reply.status(400).send({
      message: "Este agendamento já está cancelado",
    });
  }

  if (faltamMenosDeDoisDias(new Date(agendamento.data))) {
    return reply.status(400).send({
      message:
        "Não é possível cancelar agendamento com menos de 2 dias de antecedência. Entre em contato por telefone.",
    });
  }

  const agendamentoCancelado = await prisma.agendamento.update({
    where: { id },
    data: {
      status: "CANCELADO",
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return agendamentoCancelado;
});

// Confirmar agendamento
app.patch("/agendamentos/:id/confirmar", async (request, reply) => {
  const { id } = request.params as { id: string };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
  });

  if (!agendamento) {
    return reply.status(404).send({
      message: "Agendamento não encontrado",
    });
  }

  if (agendamento.status === "CANCELADO") {
    return reply.status(400).send({
      message: "Não é possível confirmar um agendamento cancelado",
    });
  }

  const agendamentoConfirmado = await prisma.agendamento.update({
    where: { id },
    data: {
      status: "CONFIRMADO",
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return agendamentoConfirmado;
});

const port = Number(process.env.PORT) || 3333;

app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`Servidor rodando na porta ${port}`);
});