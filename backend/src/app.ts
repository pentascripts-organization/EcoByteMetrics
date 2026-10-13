import express, { type Request, type Response } from "express";
import cors from "cors";
import routes from "./index.js";
import pool from "./db/connection.js";

import {
  getDiscoveredServices,
  getServicesLastUpdatedAt,
  getCollectedServiceMetrics,
  getCollectedMetricsByServiceId,
} from "./modules/services/services.service.js";

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

// Retorna as métricas coletadas de todos os serviços.
app.get("/metrics", (_req: Request, res: Response) => {
  res.json({
    metrics: getCollectedServiceMetrics(),
  });
});

// Retorna as métricas coletadas de um serviço específico.
app.get(
  "/metrics/:serviceId",
  (req: Request, res: Response) => {
    const serviceId = req.params.serviceId;

if (typeof serviceId !== "string") {
  res.status(400).json({
    error: "Identificador de serviço inválido.",
  });
  return;
}

const serviceMetrics = getCollectedMetricsByServiceId(serviceId);

    if (!serviceMetrics) {
      res.status(404).json({
        error: "Métricas não encontradas para este serviço.",
        serviceId,
      });
      return;
    }

    res.json(serviceMetrics);
  }
);

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
