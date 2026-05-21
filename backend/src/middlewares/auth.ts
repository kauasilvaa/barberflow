import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        message: "Token não informado.",
      });
    }

    const [, token] = authHeader.split(" ");

    if (!token) {
      return reply.status(401).send({
        message: "Token inválido.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "barberflow_secret_dev"
    ) as TokenPayload;

    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return reply.status(401).send({
      message: "Não autorizado.",
    });
  }
}