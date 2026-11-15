import {EnergyComparisonParams, EnergyPeriod, GlobalStatistics, StatisticRepository} from "./statistics.repository.js";


export class StatisticService{
    private periods: Record<string, string> = {
        "1h": "1 hour",
        "24h": "24 hours",
        "7d": "7 days",
        "30d": "30 days"
        };
    private statisticRepository:StatisticRepository = new StatisticRepository();

    async  getStatisticsSummary() {
        return await this.statisticRepository.getStatisticsSummaryQuery()
    }

    async getServicesRanking(requestedPeriod: string,requestedOrder: string) {
        const period = this.periods[requestedPeriod] ?? this.periods["24h"];
        const orderBy = requestedOrder === "kwh" ? "kwh" : "co2e";
        const ranking = await this.statisticRepository.getServicesRankingQuery(period, orderBy);

        return {
            periodo: requestedPeriod in this.periods ? requestedPeriod : "24h",
            ordenadoPor: orderBy,
            ranking
        };
    }
    async getGlobalStatistics(period: string): Promise<GlobalStatistics> {

    const selectedPeriod = this.periods[period];

    if (!selectedPeriod) {
      throw new Error("Período de consulta inválido.");
    }

    return await this.statisticRepository
      .getCalculationEmissionQuery(selectedPeriod);
  }

    async getEnergyCalculationUnitService(nome_service:string){
        if(nome_service){
            return await this.statisticRepository.getEnergyCalculationUnitService(nome_service);
        }
        return {"mesagem":"Nome esta invalido"};
        
    }

    async getEnergyCalculationService(){
        const result= await this.statisticRepository.getEnergyCalculation();
        return result; 
    }

    async compare(serviceA:string, serviceB:string, period:EnergyPeriod){
            if (!serviceA?.trim() || !serviceB?.trim()) {
                throw new Error("Os nomes dos serviços são obrigatórios.");
            }

            if (serviceA.trim() === serviceB.trim()) {
                throw new Error("Selecione dois serviços diferentes.");
            }

            if (serviceA === serviceB) {
            throw new Error("Selecione dois serviços diferentes.");
            }

            if (!["week", "month", "year"].includes(period)) {
            throw new Error("Período inválido.");
            }

            const end = new Date();
            const start = new Date(end);

            switch (period) {
            case "week":
                start.setUTCDate(start.getUTCDate() - 7);
                break;

            case "month":
                start.setUTCDate(start.getUTCDate() - 30);
                break;

            case "year":
                start.setUTCMonth(start.getUTCMonth() - 12);
                break;
            }

            const params: EnergyComparisonParams = {
            serviceA,
            serviceB,
            period,
            start: start.toISOString(),
            end: end.toISOString(),
            };

            return this.statisticRepository.getMetricCompare(params);
  }

}
