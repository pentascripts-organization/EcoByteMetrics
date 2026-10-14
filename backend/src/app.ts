import express, { type Request, type Response } from "express";
import cors from "cors";
import routes from "./index.js";
import pool from "./db/connection.js";

import {
  getDiscoveredServices,
  getServicesLastUpdatedAt,
} from "./modules/services/services.service.js";

import { fetchServiceMetrics } from "./integrations/metrics-api.js";

const app = express();

app.use(cors());
app.use(express.json());

// Verifica se o backend está respondendo.
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Lista os serviços descobertos pelo Agregador de Métricas.
app.get("/services", (_req: Request, res: Response) => {
  res.json({
    services: getDiscoveredServices(),
    lastUpdatedAt: getServicesLastUpdatedAt(),
  });
});

app.get("/metrics/:serviceId", async (req: Request, res: Response) => {
  const serviceId = req.params.serviceId;
  if (typeof serviceId !== "string" || !serviceId.trim()) {
    res.status(400).json({ error: "invalid_service_id" });
    return;
  }
  try {
    const result = await fetchServiceMetrics(serviceId);
    res.status(result.status).json(result.body);
  } catch (error: unknown) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    res.status(timeout ? 504 : 502).json({
      error: timeout ? "metrics_timeout" : error instanceof Error && error.name === "InvalidMetricsError" ? "invalid_metrics" : "metrics_collection_failed",
    });
  }
});

// Rotas existentes da API.
app.use("/api", routes);

// Consulta existente ao banco de dados.
app.get("/", async (_req: Request, res: Response) => {
  try {
    const response = await pool.query(
      "SELECT name_user FROM users"
    );

    res.status(200).json({
      mensagem: response.rows[0]?.name_user ?? null,
    });
  } catch (error) {
    console.error("Erro ao executar a consulta SQL:", error);

    res.status(500).json({
      mensagem: "Erro ao consultar o banco de dados.",
    });
  }
});

export default app;
