import express, { type Request, type Response } from "express";
import cors from "cors";
import userRouter from "./modules/Users/user.router.js";
import metricRouter from "./modules/Metrics/metric.router.js";
import carbonRouter from "./modules/Carbons/carbon.router.js";
import serviceRouter from "./modules/Services/service.router.js";
import locationRouter from "./modules/Locations/location.router.js";

import {
  getDiscoveredServices,
  getServicesLastUpdatedAt,
} from "./modules/Services/services.service.js";


const app = express();

app.use(cors());
app.use(express.json());
// Rotas existentes da API.
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

// Rotas do módulo de usuários.
app.use("/api/users", userRouter);
// Rotas do módulo de métricas.
app.use("/api/metrics", metricRouter);
//Rota do Carbon
app.use("/api/carbons",carbonRouter);
//Rota do service
app.use("/api/services", serviceRouter);
//Rota da Localização
app.use("/api/locations",locationRouter);

export default app;
