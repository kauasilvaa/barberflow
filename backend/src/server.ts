import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";


import { authRoutes } from "./routes/auth";
import { clientesRoutes } from "./routes/clientes";
import { profissionaisRoutes } from "./routes/profissionais";
import { procedimentosRoutes } from "./routes/procedimentos";
import { atendimentosRoutes } from "./routes/atendimentos";
import { dashboardRoutes } from "./routes/dashboard";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

app.get("/health", async () => {
  return {
    status: "ok",
    message: "API ClinicFlow Estética funcionando",
  };
});

app.register(authRoutes);
app.register(clientesRoutes);
app.register(profissionaisRoutes);
app.register(procedimentosRoutes);
app.register(atendimentosRoutes);
app.register(dashboardRoutes);

const port = Number(process.env.PORT) || 3333;

app.listen({
  port,
  host: "0.0.0.0",
}).then(() => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});