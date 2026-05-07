import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function clientesRoutes(app: FastifyInstance) {

  // Criar cliente
  app.post("/clientes", async (request, reply) => {
    const {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      observacoes,
    } = request.body as {
      nome: string;
      email: string;
      telefone: string;
      cpf?: string;
      dataNascimento?: string;
      observacoes?: string;
    };

    if (!nome || !email || !telefone) {
      return reply.status(400).send({
        message: "Nome, email e telefone são obrigatórios",
      });
    }

    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { email },
          cpf ? { cpf } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (clienteExistente) {
      return reply.status(400).send({
        message: "Cliente já cadastrado com este email ou CPF",
      });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        telefone,
        cpf,
        observacoes,
        dataNascimento: dataNascimento
          ? new Date(dataNascimento)
          : undefined,
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
      include: {
        atendimentos: true,
      },
    });
  });

  // Buscar cliente por ID
  app.get("/clientes/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        atendimentos: {
          include: {
            profissional: true,
            procedimentos: {
              include: {
                procedimento: true,
              },
            },
          },
          orderBy: {
            data: "desc",
          },
        },
      },
    });

    if (!cliente) {
      return reply.status(404).send({
        message: "Cliente não encontrado",
      });
    }

    return cliente;
  });

  // Atualizar cliente
  app.put("/clientes/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    const {
      nome,
      email,
      telefone,
      cpf,
      dataNascimento,
      observacoes,
    } = request.body as {
      nome?: string;
      email?: string;
      telefone?: string;
      cpf?: string;
      dataNascimento?: string;
      observacoes?: string;
    };

    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente) {
      return reply.status(404).send({
        message: "Cliente não encontrado",
      });
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        email,
        telefone,
        cpf,
        observacoes,
        dataNascimento: dataNascimento
          ? new Date(dataNascimento)
          : undefined,
      },
    });

    return clienteAtualizado;
  });

  // Deletar cliente
  app.delete("/clientes/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        atendimentos: true,
      },
    });

    if (!cliente) {
      return reply.status(404).send({
        message: "Cliente não encontrado",
      });
    }

    if (cliente.atendimentos.length > 0) {
      return reply.status(400).send({
        message:
          "Não é possível excluir cliente com atendimentos vinculados",
      });
    }

    await prisma.cliente.delete({
      where: { id },
    });

    return reply.status(204).send();
  });

}