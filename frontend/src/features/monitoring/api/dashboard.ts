import type { Period } from "@/shared/lib/period";

export type DashboardRankingMetric = "kwh" | "co2e";

export interface DashboardSummary {
  totalServicos: number;
  servicosAtivos: number;
  servicosIndisponiveis: number;
  servicosSemMetricas: number;
  consumoTotalKwh: number;
  emissaoTotalCo2e: number | null;
  dataHoraUltimaAtualizacao: string | null;
}

export interface DashboardRankingEntry {
  posicao: number;
  id_servico: string;
  nome: string;
  consumoKwh: number;
  emissaoCo2e: number | null;
}

export interface DashboardRanking {
  periodo: Period;
  ordenadoPor: DashboardRankingMetric;
  ranking: DashboardRankingEntry[];
}

const BACKEND_API = (import.meta.env?.VITE_BACKEND_URL ?? "/backend").replace(
  /\/+$/,
  "",
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function parseDashboardSummary(value: unknown): DashboardSummary {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value.totalServicos) ||
    !isNonNegativeInteger(value.servicosAtivos) ||
    !isNonNegativeInteger(value.servicosIndisponiveis) ||
    !isNonNegativeInteger(value.servicosSemMetricas) ||
    !isNonNegativeNumber(value.consumoTotalKwh) ||
    (value.emissaoTotalCo2e !== null && !isNonNegativeNumber(value.emissaoTotalCo2e)) ||
    (value.dataHoraUltimaAtualizacao !== null &&
      (typeof value.dataHoraUltimaAtualizacao !== "string" ||
        !Number.isFinite(Date.parse(value.dataHoraUltimaAtualizacao))))
  ) {
    throw new Error("A resposta do resumo do dashboard está fora do contrato.");
  }

  return value as unknown as DashboardSummary;
}

function parseDashboardRanking(value: unknown): DashboardRanking {
  if (
    !isRecord(value) ||
    (value.periodo !== "24h" && value.periodo !== "7d") ||
    (value.ordenadoPor !== "kwh" && value.ordenadoPor !== "co2e") ||
    !Array.isArray(value.ranking) ||
    !value.ranking.every((entry) =>
      isRecord(entry) &&
      Number.isSafeInteger(entry.posicao) && (entry.posicao as number) > 0 &&
      typeof entry.id_servico === "string" && entry.id_servico.trim().length > 0 &&
      typeof entry.nome === "string" && entry.nome.trim().length > 0 &&
      isNonNegativeNumber(entry.consumoKwh) &&
      (entry.emissaoCo2e === null || isNonNegativeNumber(entry.emissaoCo2e))
    )
  ) {
    throw new Error("A resposta do ranking do dashboard está fora do contrato.");
  }

  return value as unknown as DashboardRanking;
}

async function request<T>(
  path: string,
  signal: AbortSignal,
  parse: (value: unknown) => T,
): Promise<T> {
  const response = await fetch(BACKEND_API + path, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Backend respondeu HTTP ${response.status}.`;
    throw new Error(error);
  }
  return parse(body);
}

export function getDashboardSummary(
  signal = new AbortController().signal,
): Promise<DashboardSummary> {
  return request("/api/dashboard/summary", signal, parseDashboardSummary);
}

export function getDashboardRanking(
  period: Period,
  orderBy: DashboardRankingMetric,
  signal = new AbortController().signal,
): Promise<DashboardRanking> {
  const params = new URLSearchParams({
    periodo: period,
    ordenarPor: orderBy,
  });
  return request(`/api/dashboard/ranking?${params}`, signal, parseDashboardRanking);
}
