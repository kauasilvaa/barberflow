import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "barberflow_secret_dev";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const { email, senha } = request.body as {
      email: string;
      senha: string;
    };

    if (!email || !senha) {
      return reply.status(400).send({
        message: "Email e senha são obrigatórios",
      });
    }

    let usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario && email === "admin@barberflow.com") {
      const senhaHash = await bcrypt.hash("123456", 10);

      usuario = await prisma.usuario.create({
        data: {
          nome: "Administrador",
          email: "admin@barberflow.com",
          senha: senhaHash,
          role: "ADMIN",
        },
      });
    }

    if (!usuario) {
      return reply.status(401).send({
        message: "Email ou senha inválidos",
      });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return reply.status(401).send({
        message: "Email ou senha inválidos",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
      token,
    };
  });
}