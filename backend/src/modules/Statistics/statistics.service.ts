import {
  StatisticRepository,
} from "./statistics.repository.js";

import type {
  EnergyComparisonParams,
  EnergyPeriod,
  GlobalStatistics,
} from "./statistics.repository.js";

export class StatisticsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "StatisticsError";
  }
}

export class StatisticService {
  private periods: Record<string, number> = {
    "1h": 1,
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  };

  private statisticRepository: StatisticRepository =
    new StatisticRepository();

  /**
   * Calcula o início e o fim de um período.
   * O horário final é definido uma única vez.
   */
  private getPeriodRange(period: string) {
    if (!Object.hasOwn(this.periods, period)) {
      throw new Error("Período de consulta inválido.");
    }

    const hours = this.periods[period];

    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  async getStatisticsSummary() {
    return await this.statisticRepository
      .getStatisticsSummaryQuery();
  }

  async getServicesRanking(
    requestedPeriod: string,
    requestedOrder: string
  ) {
    if (!Object.hasOwn(this.periods, requestedPeriod)) {
      throw new Error("Período de consulta inválido.");
    }

    const selectedPeriod = requestedPeriod;

    if (requestedOrder !== "kwh" && requestedOrder !== "co2e") {
      throw new Error("Métrica de ordenação inválida.");
    }

    const orderBy = requestedOrder;

    const { start, end } =
      this.getPeriodRange(selectedPeriod);

    const ranking =
      await this.statisticRepository.getServicesRankingQuery(
        start,
        end,
        orderBy
      );

    return {
      periodo: selectedPeriod,
      ordenadoPor: orderBy,
      ranking,
    };
  }

  async getGlobalStatistics(
    period: string
  ): Promise<GlobalStatistics> {
    if (!Object.hasOwn(this.periods, period)) {
      throw new Error("Período de consulta inválido.");
    }

    const { start, end } =
      this.getPeriodRange(period);

    return await this.statisticRepository
      .getCalculationEmissionQuery(start, end);
  }

  async getEnergyCalculationUnitService(
    nome_service: string
  ) {
    if (nome_service) {
      return await this.statisticRepository
        .getEnergyCalculationUnitService(nome_service);
    }

    return {
      mesagem: "Nome esta invalido",
    };
  }

  async getEnergyCalculationService() {
    const result =
      await this.statisticRepository.getEnergyCalculation();

    return result;
  }

  async compare(
    ids: number[],
    period: EnergyPeriod
  ) {
    if (
      !Array.isArray(ids) ||
      ids.some(id => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(ids).size !== ids.length
    ) {
      throw new Error("Lista de serviços inválida.");
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
      ids,
      period,
      start: start.toISOString(),
      end: end.toISOString(),
    };

    const data =
      await this.statisticRepository.getMetricCompare(params);

    const returnedIds = new Set(
      data.map(item => Number(item.id_service))
    );

    const missingIds = ids.filter(
      id => !returnedIds.has(id)
    );

    if (missingIds.length > 0) {
      throw new StatisticsError(
        `Serviços não encontrados: ${missingIds.join(", ")}.`,
        404
      );
    }

    return data;
  }
}
