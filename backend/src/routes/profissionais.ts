import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function profissionaisRoutes(app: FastifyInstance) {
  app.post("/profissionais", async (request, reply) => {
    const { nome, email, telefone, especialidade, ativo } = request.body as {
      nome: string;
      email: string;
      telefone: string;
      especialidade: string;
      ativo?: boolean;
    };

    if (!nome || !email || !telefone || !especialidade) {
      return reply.status(400).send({
        message: "Nome, email, telefone e especialidade são obrigatórios",
      });
    }

    const profissionalExistente = await prisma.profissional.findUnique({
      where: { email },
    });

    if (profissionalExistente) {
      return reply.status(400).send({
        message: "Já existe um profissional cadastrado com este email",
      });
    }

    const profissional = await prisma.profissional.create({
      data: {
        nome,
        email,
        telefone,
        especialidade,
        ativo: ativo ?? true,
      },
    });

    return reply.status(201).send(profissional);
  });

  app.get("/profissionais", async () => {
    return prisma.profissional.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        atendimentos: true,
      },
    });
  });

  app.get("/profissionais/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const profissional = await prisma.profissional.findUnique({
      where: { id },
      include: {
        atendimentos: {
          include: {
            cliente: true,
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

    if (!profissional) {
      return reply.status(404).send({
        message: "Profissional não encontrado",
      });
    }

    return profissional;
  });

  app.put("/profissionais/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const { nome, email, telefone, especialidade, ativo } = request.body as {
      nome?: string;
      email?: string;
      telefone?: string;
      especialidade?: string;
      ativo?: boolean;
    };

    const profissional = await prisma.profissional.findUnique({
      where: { id },
    });

    if (!profissional) {
      return reply.status(404).send({
        message: "Profissional não encontrado",
      });
    }

    const profissionalAtualizado = await prisma.profissional.update({
      where: { id },
      data: {
        nome,
        email,
        telefone,
        especialidade,
        ativo,
      },
    });

    return profissionalAtualizado;
  });

  app.delete("/profissionais/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const profissional = await prisma.profissional.findUnique({
      where: { id },
      include: {
        atendimentos: true,
      },
    });

    if (!profissional) {
      return reply.status(404).send({
        message: "Profissional não encontrado",
      });
    }

    if (profissional.atendimentos.length > 0) {
      return reply.status(400).send({
        message: "Não é possível excluir profissional com atendimentos vinculados",
      });
    }

    await prisma.profissional.delete({
      where: { id },
    });

    return reply.status(204).send();
  });
}