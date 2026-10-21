import { Router, type Request, type Response } from "express";
import {
  getServicesRanking,
  getStatisticsSummary,
} from "./statistics.service.js";

const router = Router();

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await getStatisticsSummary();
    res.json(summary);
  } catch (error) {
    console.error("Failed to fetch statistics summary:", error);
    res.status(500).json({ error: "Erro ao calcular os indicadores consolidados." });
  }
});

router.get("/ranking", async (req: Request, res: Response) => {
  try {
    const requestedPeriod = req.query.periodo;
    const requestedOrder = req.query.ordenarPor;
    const ranking = await getServicesRanking(
      typeof requestedPeriod === "string" ? requestedPeriod : "24h",
      typeof requestedOrder === "string" ? requestedOrder : "co2e"
    );
    res.json(ranking);
  } catch (error) {
    console.error("Failed to fetch services ranking:", error);
    res.status(500).json({ error: "Erro ao calcular o ranking de serviços." });
  }
});

export default router;
