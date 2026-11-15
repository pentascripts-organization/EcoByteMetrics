
import { type Request, type Response } from "express";
import { StatisticService } from "./statistics.service.js";
import { EnergyPeriod } from "./statistics.repository.js";

export class StatisticController {
    private statisticService: StatisticService = new StatisticService();

    summary = async (_req: Request, res: Response): Promise<void> => {
        try {
            const summary =
                await this.statisticService.getStatisticsSummary();

            res.status(200).json(summary);
        } catch (error: unknown) {
            console.error(
                "Falha ao buscar indicadores consolidados:",
                error
            );

            res.status(500).json({
                error: "Erro ao calcular os indicadores consolidados."
            });
        }
    };

    ranking = async (req: Request,res: Response): Promise<void> => {
        try {
            const requestedPeriod = req.query.periodo;
            const requestedOrder = req.query.ordenarPor;

            const ranking =
                await this.statisticService.getServicesRanking(
                    typeof requestedPeriod === "string"
                        ? requestedPeriod
                        : "24h",
                    typeof requestedOrder === "string"
                        ? requestedOrder
                        : "co2e"
                );

            res.status(200).json(ranking);
        } catch (error: unknown) {
            console.error(
                "Falha ao buscar ranking de serviços:",
                error
            );

            res.status(500).json({
                error: "Erro ao calcular o ranking de serviços."
            });
        }
    };

    calculationEnergyByUnit = async(req:Request, res:Response):Promise<void>=>{
        try{
            let nomeService:string|null;
            nomeService = String(req.params.nome_service);
            console.log("Nome do serviço recebido:", nomeService);
            if (!nomeService || nomeService.trim() === "") {
                res.status(400).json({ message: "O nome do serviço é obrigatório."});
                return;
            }
            const serviceEnergy=await this.statisticService.getEnergyCalculationUnitService(nomeService);
            if (!serviceEnergy) {
                res.status(404).json({message: "Serviço não encontrado."});
                return;
            }
            
            res.status(200).json(serviceEnergy);

        }catch(error:unknown){
            console.error("Erro ao buscar cálculo energético:", error);
            res.status(500).json({ message: "Erro interno ao calcular energia do serviço."});
        }
    }

    calculationEnergy = async(req:Request, res:Response):Promise<void>=>{
        try{
            const serviceEnergy=await this.statisticService.getEnergyCalculationService();
            if (serviceEnergy.length === 0) {
                res.status(404).json({message: "Nenhum cálculo energético encontrado."});
                return;
            }
            
            res.status(200).json(serviceEnergy);

        }catch(error:unknown){
            console.error("Erro ao buscar cálculo energético:", error);
            res.status(500).json({ message: "Erro interno ao calcular energia do serviço."});
        }
    }
    getGlobalStatistics = async (req: Request,res: Response): Promise<void> => {
    try {

      const period = String(req.query.periodo ?? "24h");

      const statistics =
        await this.statisticService.getGlobalStatistics(period);

      res.status(200).json({
        success: true,
        data: statistics
      });

    } catch (error) {

      console.error("Erro ao obter indicadores globais:", error);

      res.status(500).json({
        success: false,
        message: "Não foi possível obter os indicadores globais."
      });
    }
  };

  compare = async(req: Request, res: Response) => {
        try {
            const idsParam = req.query.ids;
            const period = String(req.query.period) as EnergyPeriod;

            if (typeof idsParam !== "string") {
                return res.status(400).json({
                success: false,
                message: "Informe os IDs dos serviços."
                });
            }

            const ids = idsParam.split(",").map(Number);

            if (
                ids.length < 2 ||
                ids.some(id => !Number.isInteger(id) || id <= 0) ||
                new Set(ids).size !== ids.length
            ) {
                return res.status(400).json({
                success: false,
                message: "Informe pelo menos dois IDs válidos e distintos."
                });
            }

            const data = await this.statisticService.compare(
                ids,
                period,
            );

            return res.status(200).json({
                success: true,
                period,
                data,
            });
        } catch (error) {
            const message =
                error instanceof Error
                ? error.message
                : "Erro ao comparar serviços.";

            return res.status(500).json({
                success: false,
                message,
            });
    }
  }
}
