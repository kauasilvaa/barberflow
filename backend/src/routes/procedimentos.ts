import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function procedimentosRoutes(app: FastifyInstance) {
  app.post("/procedimentos", async (request, reply) => {
    const { nome, descricao, categoria, preco, duracao, ativo } = request.body as {
      nome: string;
      descricao?: string;
      categoria: string;
      preco: number;
      duracao: number;
      ativo?: boolean;
    };

    if (!nome || !categoria || preco <= 0 || duracao <= 0) {
      return reply.status(400).send({
        message: "Nome, categoria, preço e duração válidos são obrigatórios",
      });
    }

    const procedimento = await prisma.procedimento.create({
      data: {
        nome,
        descricao,
        categoria,
        preco,
        duracao,
        ativo: ativo ?? true,
      },
    });

    return reply.status(201).send(procedimento);
  });

  app.get("/procedimentos", async () => {
    return prisma.procedimento.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  app.get("/procedimentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const procedimento = await prisma.procedimento.findUnique({
      where: { id },
    });

    if (!procedimento) {
      return reply.status(404).send({
        message: "Procedimento não encontrado",
      });
    }

    return procedimento;
  });

  app.put("/procedimentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const { nome, descricao, categoria, preco, duracao, ativo } = request.body as {
      nome?: string;
      descricao?: string;
      categoria?: string;
      preco?: number;
      duracao?: number;
      ativo?: boolean;
    };

    const procedimento = await prisma.procedimento.findUnique({
      where: { id },
    });

    if (!procedimento) {
      return reply.status(404).send({
        message: "Procedimento não encontrado",
      });
    }

    const procedimentoAtualizado = await prisma.procedimento.update({
      where: { id },
      data: {
        nome,
        descricao,
        categoria,
        preco,
        duracao,
        ativo,
      },
    });

    return procedimentoAtualizado;
  });

  app.delete("/procedimentos/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const procedimento = await prisma.procedimento.findUnique({
      where: { id },
      include: {
        atendimentos: true,
      },
    });

    if (!procedimento) {
      return reply.status(404).send({
        message: "Procedimento não encontrado",
      });
    }

    if (procedimento.atendimentos.length > 0) {
      return reply.status(400).send({
        message: "Não é possível excluir procedimento com atendimentos vinculados",
      });
    }

    await prisma.procedimento.delete({
      where: { id },
    });

    return reply.status(204).send();
  });
}