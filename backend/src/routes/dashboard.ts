import { FastifyInstance } from "fastify";
import { StatusAtendimento } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", async () => {
    const totalAtendimentos = await prisma.atendimento.count();

    const confirmados = await prisma.atendimento.count({
      where: { status: StatusAtendimento.CONFIRMADO },
    });

    const pendentes = await prisma.atendimento.count({
      where: { status: StatusAtendimento.PENDENTE },
    });

    const realizados = await prisma.atendimento.count({
      where: { status: StatusAtendimento.REALIZADO },
    });

    const cancelados = await prisma.atendimento.count({
      where: { status: StatusAtendimento.CANCELADO },
    });

    const clientes = await prisma.cliente.count();

    const profissionaisAtivos = await prisma.profissional.count({
      where: { ativo: true },
    });

    const procedimentosAtivos = await prisma.procedimento.count({
      where: { ativo: true },
    });

    const faturamentoPrevisto = await prisma.atendimento.aggregate({
      where: {
        status: {
          in: [StatusAtendimento.PENDENTE, StatusAtendimento.CONFIRMADO],
        },
      },
      _sum: {
        valorTotal: true,
      },
    });

    const faturamentoRealizado = await prisma.atendimento.aggregate({
      where: {
        status: StatusAtendimento.REALIZADO,
      },
      _sum: {
        valorTotal: true,
      },
    });

    return {
      totalAtendimentos,
      confirmados,
      pendentes,
      realizados,
      cancelados,
      clientes,
      profissionaisAtivos,
      procedimentosAtivos,
      faturamentoPrevisto: faturamentoPrevisto._sum.valorTotal ?? 0,
      faturamentoRealizado: faturamentoRealizado._sum.valorTotal ?? 0,
    };
  });
}