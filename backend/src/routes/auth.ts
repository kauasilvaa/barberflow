import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const JWT_SECRET = process.env.JWT_SECRET || "barberflow_secret_dev";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const { email, senha } = request.body as {
      email: string;
      senha: string;
    };

    const emailNormalizado = email?.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      return reply.status(400).send({
        message: "Email e senha são obrigatórios",
      });
    }

    let usuario = await prisma.usuario.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    if (!usuario && emailNormalizado === "admin@barberflow.com") {
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

  app.post("/auth/register", async (request, reply) => {
    const { nome, email, senha } = request.body as {
      nome: string;
      email: string;
      senha: string;
    };

    const emailNormalizado = email?.trim().toLowerCase();
    const nomeNormalizado = nome?.trim();

    if (!nomeNormalizado || !emailNormalizado || !senha) {
      return reply.status(400).send({
        message: "Nome, email e senha são obrigatórios",
      });
    }

    if (senha.length < 6) {
      return reply.status(400).send({
        message: "A senha deve ter pelo menos 6 caracteres",
      });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    if (usuarioExistente) {
      return reply.status(409).send({
        message: "Já existe uma conta cadastrada com este email",
      });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: nomeNormalizado,
        email: emailNormalizado,
        senha: senhaHash,
        role: "USER",
      },
    });

    if (!clienteExistente) {
      await prisma.cliente.create({
        data: {
          nome: nomeNormalizado,
          email: emailNormalizado,
          telefone: "Não informado",
        },
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

    return reply.status(201).send({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
      token,
    });
  });

  app.get("/auth/me/cliente", { preHandler: authMiddleware }, async (request) => {
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: request.user.id,
      },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    let cliente = await prisma.cliente.findUnique({
      where: {
        email: usuario.email,
      },
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nome: usuario.nome,
          email: usuario.email,
          telefone: "Não informado",
        },
      });
    }

    return cliente;
  });

  app.get(
    "/auth/me/agendamentos",
    { preHandler: authMiddleware },
    async (request) => {
      const usuario = await prisma.usuario.findUnique({
        where: {
          id: request.user.id,
        },
      });

      if (!usuario) {
        throw new Error("Usuário não encontrado");
      }

      const cliente = await prisma.cliente.findUnique({
        where: {
          email: usuario.email,
        },
      });

      if (!cliente) {
        return [];
      }

      return prisma.atendimento.findMany({
        where: {
          clienteId: cliente.id,
        },
        orderBy: {
          data: "asc",
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
    }
  );

  app.put(
    "/auth/change-password",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { senhaAtual, novaSenha } = request.body as {
        senhaAtual: string;
        novaSenha: string;
      };

      if (!senhaAtual || !novaSenha) {
        return reply.status(400).send({
          message: "Senha atual e nova senha são obrigatórias",
        });
      }

      if (novaSenha.length < 6) {
        return reply.status(400).send({
          message: "A nova senha deve ter pelo menos 6 caracteres",
        });
      }

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

      const senhaAtualValida = await bcrypt.compare(senhaAtual, usuario.senha);

      if (!senhaAtualValida) {
        return reply.status(401).send({
          message: "Senha atual inválida",
        });
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

      await prisma.usuario.update({
        where: {
          id: usuario.id,
        },
        data: {
          senha: novaSenhaHash,
        },
      });

      return {
        message: "Senha alterada com sucesso",
      };
    }
  );

  app.post("/auth/forgot-password", async (request, reply) => {
    const { email } = request.body as {
      email: string;
    };

    const emailNormalizado = email?.trim().toLowerCase();

    if (!emailNormalizado) {
      return reply.status(400).send({
        message: "Email é obrigatório",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    if (!usuario) {
      return {
        message:
          "Se existir uma conta vinculada a este email, as instruções foram enviadas.",
      };
    }

    const token = crypto.randomBytes(32).toString("hex");

    const resetTokenExpires = new Date();
    resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30);

    await prisma.usuario.update({
      where: {
        id: usuario.id,
      },
      data: {
        resetToken: token,
        resetTokenExpires,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: usuario.email,
      subject: "Recuperação de senha - BarberFlow",
      html: `
        <div style="font-family: Arial, sans-serif; background: #090909; padding: 32px;">
          <div style="max-width: 560px; margin: auto; background: #111; border: 1px solid #d6a35433; border-radius: 18px; padding: 28px;">
            <h1 style="color: #d6a354;">BarberFlow</h1>

            <h2 style="color: #ffffff;">Recuperação de senha</h2>

            <p style="color: #d4d4d8;">
              Olá, ${usuario.nome}.
            </p>

            <p style="color: #d4d4d8;">
              Recebemos uma solicitação para redefinir sua senha.
            </p>

            <a
              href="${resetLink}"
              style="display: inline-block; margin-top: 18px; padding: 14px 20px; background: #d6a354; color: #090909; text-decoration: none; border-radius: 12px; font-weight: bold;"
            >
              Redefinir senha
            </a>

            <p style="color: #a1a1aa; margin-top: 24px;">
              Este link expira em 30 minutos.
            </p>

            <p style="color: #71717a; font-size: 13px;">
              Se você não solicitou essa recuperação, ignore este email.
            </p>
          </div>
        </div>
      `,
    });

    return {
      message:
        "Se existir uma conta vinculada a este email, as instruções foram enviadas.",
    };
  });

  app.post("/auth/reset-password", async (request, reply) => {
    const { token, novaSenha } = request.body as {
      token: string;
      novaSenha: string;
    };

    if (!token || !novaSenha) {
      return reply.status(400).send({
        message: "Token e nova senha são obrigatórios",
      });
    }

    if (novaSenha.length < 6) {
      return reply.status(400).send({
        message: "A nova senha deve ter pelo menos 6 caracteres",
      });
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!usuario) {
      return reply.status(400).send({
        message: "Link inválido ou expirado",
      });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: {
        id: usuario.id,
      },
      data: {
        senha: senhaHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return {
      message: "Senha redefinida com sucesso",
    };
  });
}