import {
    getServicesRankingQuery,
    getStatisticsSummaryQuery,
} from "./statistics.repository.js";

const PERIODS: Record<string, string> = {
    "1h": "1 hour",
    "24h": "24 hours",
    "7d": "7 days"
};

export async function getStatisticsSummary() {
    return getStatisticsSummaryQuery();
}

export async function getServicesRanking(
    requestedPeriod: string,
    requestedOrder: string
) {
    const period = PERIODS[requestedPeriod] ?? PERIODS["24h"];
    const orderBy = requestedOrder === "kwh" ? "kwh" : "co2e";
    const ranking = await getServicesRankingQuery(period, orderBy);

    return {
        periodo: requestedPeriod in PERIODS ? requestedPeriod : "24h",
        ordenadoPor: orderBy,
        ranking
    };
}
