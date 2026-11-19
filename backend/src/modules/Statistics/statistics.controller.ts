import { type Request, type Response } from "express";
import { StatisticService, StatisticsError } from "./statistics.service.js";
import { EnergyPeriod } from "./statistics.repository.js";

export class StatisticController {
  private statisticService: StatisticService = new StatisticService();

  summary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.statisticService.getStatisticsSummary();

      res.status(200).json(summary);
    } catch (error: unknown) {
      console.error("Falha ao buscar indicadores consolidados:", error);

      res.status(500).json({
        error: "Erro ao calcular os indicadores consolidados.",
      });
    }
  };

  ranking = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestedPeriod =
        typeof req.query.periodo === "string" ? req.query.periodo : "24h";

      const requestedOrder =
        typeof req.query.ordenarPor === "string"
          ? req.query.ordenarPor
          : "co2e";

      if (!["1h", "24h", "7d", "30d"].includes(requestedPeriod)) {
        res.status(400).json({
          error: "Período inválido.",
        });
        return;
      }

      if (!["kwh", "co2e"].includes(requestedOrder)) {
        res.status(400).json({
          error: "Métrica de ordenação inválida.",
        });
        return;
      }

      const ranking = await this.statisticService.getServicesRanking(
        requestedPeriod,
        requestedOrder,
      );

      res.status(200).json(ranking);
    } catch (error: unknown) {
      console.error("Falha ao buscar ranking de serviços:", error);

      res.status(500).json({
        error: "Erro ao calcular o ranking de serviços.",
      });
    }
  };

  calculationEnergyByUnit = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      let nomeService: string | null;
      nomeService = String(req.params.nome_service);
      console.log("Nome do serviço recebido:", nomeService);
      if (!nomeService || nomeService.trim() === "") {
        res.status(400).json({ message: "O nome do serviço é obrigatório." });
        return;
      }
      const serviceEnergy =
        await this.statisticService.getEnergyCalculationUnitService(
          nomeService,
        );
      if (!serviceEnergy) {
        res.status(404).json({ message: "Serviço não encontrado." });
        return;
      }

      res.status(200).json(serviceEnergy);
    } catch (error: unknown) {
      console.error("Erro ao buscar cálculo energético:", error);
      res
        .status(500)
        .json({ message: "Erro interno ao calcular energia do serviço." });
    }
  };

  calculationEnergy = async (req: Request, res: Response): Promise<void> => {
    try {
      const serviceEnergy =
        await this.statisticService.getEnergyCalculationService();
      if (serviceEnergy.length === 0) {
        res
          .status(404)
          .json({ message: "Nenhum cálculo energético encontrado." });
        return;
      }

      res.status(200).json(serviceEnergy);
    } catch (error: unknown) {
      console.error("Erro ao buscar cálculo energético:", error);
      res
        .status(500)
        .json({ message: "Erro interno ao calcular energia do serviço." });
    }
  };
  getGlobalStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const period = String(req.query.periodo ?? "24h");

      const statistics =
        await this.statisticService.getGlobalStatistics(period);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("Erro ao obter indicadores globais:", error);

      res.status(500).json({
        success: false,
        message: "Não foi possível obter os indicadores globais.",
      });
    }
  };

  compare = async (req: Request, res: Response) => {
    try {
      const idsParam = req.query.ids;
      const periodParam = req.query.period;

      if (typeof idsParam !== "string") {
        return res.status(400).json({
          success: false,
          message: "Informe os IDs dos serviços.",
        });
      }

      if (
        typeof periodParam !== "string" ||
        !["week", "month", "year"].includes(periodParam)
      ) {
        return res.status(400).json({
          success: false,
          message: "Informe um período válido: week, month ou year.",
        });
      }

      const ids = idsParam.split(",").map(Number);

      if (
        ids.length < 2 ||
        ids.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
        new Set(ids).size !== ids.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Informe pelo menos dois IDs válidos e distintos.",
        });
      }

      const period = periodParam as EnergyPeriod;

      const data = await this.statisticService.compare(ids, period);

      return res.status(200).json({
        success: true,
        period,
        data,
      });
    } catch (error: unknown) {
      console.error("Erro ao comparar serviços:", error);

      if (error instanceof StatisticsError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erro interno ao comparar serviços.",
      });
    }
  };
}
