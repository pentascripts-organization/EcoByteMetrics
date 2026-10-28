import type { CollectionPoint } from "../types.ts";
import type { DashboardMetric } from "./dashboard.ts";
import { mergeCollectionHistory, summarizeCollections } from "./history.ts";

export type EvolutionMode = "intervals" | "cumulative";
export interface EvolutionPoint { timestamp: number; value: number | null; gap: boolean; reason?: string }

export function evolutionData(history: CollectionPoint[], metric: DashboardMetric, mode: EvolutionMode) {
  const samples = mergeCollectionHistory([], history).filter(point => Number.isFinite(Date.parse(point.collectedAt)))
    .sort((a, b) => Date.parse(a.collectedAt) - Date.parse(b.collectedAt));
  let first: number | null = null, last: number | null = null;
  const services = new Set<string>();
  for (const sample of samples) {
    const timestamp = Date.parse(sample.collectedAt);
    first = first === null ? timestamp : Math.min(first, timestamp);
    last = last === null ? timestamp : Math.max(last, timestamp);
    services.add(sample.serviceId);
  }
  const span = (last ?? 0) - (first ?? 0);
  const intervalMs = span <= 3600_000 ? 30_000 : span <= 86400_000 ? 300_000 : 3600_000;
  const buckets = new Map<number, { timestamp: number; first: number; last: number; total: number; complete: boolean }>();
  let batchStart = -Infinity;
  for (const sample of samples) {
    const collectedAt = Date.parse(sample.collectedAt);
    // Agrupa aplicações próximas sem criar lacunas pela virada de um bloco no relógio.
    if (collectedAt - batchStart >= intervalMs / 2) batchStart = collectedAt;
    const key = intervalMs === 30_000 ? batchStart : Math.floor(collectedAt / intervalMs) * intervalMs;
    const bucket = buckets.get(key) ?? { timestamp: key, first: collectedAt, last: collectedAt, total: 0, complete: true };
    bucket.last = collectedAt;
    if (intervalMs === 30_000) bucket.timestamp = collectedAt;
    const value = metric === "energy" ? sample.energyKwh : sample.emissionsG;
    if (value === null || !Number.isFinite(value)) bucket.complete = false;
    else bucket.total += value;
    buckets.set(key, bucket);
  }
  let total = 0, complete = true, previous: number | null = null;
  const points: EvolutionPoint[] = [...buckets.values()].map(bucket => {
    complete &&= bucket.complete;
    total += bucket.total;
    const value = mode === "cumulative" ? complete ? total : null : bucket.complete ? bucket.total : null;
    const gap = previous === null || bucket.first - previous > intervalMs * 1.5;
    previous = bucket.last;
    return { timestamp: bucket.timestamp, value, gap, ...(value === null ? {
      reason: !bucket.complete
        ? "Há amostras neste intervalo, mas falta uma estimativa de emissões. O fator de carbono pode estar indisponível."
        : "O acumulado está incompleto porque uma amostra anterior não tem estimativa de emissões.",
    } : {}) };
  });
  return { points, intervalMs, first, last, serviceCount: services.size, summary: summarizeCollections(samples) };
}

export function nearestEvolutionPoint(points: EvolutionPoint[], timestamp: number) {
  let low = 0, high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle]!.timestamp < timestamp) low = middle + 1;
    else high = middle;
  }
  return low > 0 && timestamp - points[low - 1]!.timestamp < points[low]!.timestamp - timestamp ? low - 1 : low;
}
