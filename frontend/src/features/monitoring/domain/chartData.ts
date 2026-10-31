import type { EvolutionPoint } from "./evolution.ts";
import type { CollectionEvent } from "../types.ts";

export interface EvolutionChartPoint {
  timestamp: number; value: number | null; missing?: boolean;
  from?: number; to?: number; reason?: string; events?: CollectionEvent[];
}

export function evolutionChartData(points: EvolutionPoint[], intervalMs: number, events: CollectionEvent[] = []): EvolutionChartPoint[] {
  const result: EvolutionChartPoint[] = [];
  for (let index = 0; index < points.length; index++) {
    const point = points[index]!, previous = points[index - 1];
    if (previous && point.gap && point.timestamp - previous.timestamp > intervalMs * 1.5) {
      result.push({
        timestamp: previous.timestamp + (point.timestamp - previous.timestamp) / 2, value: null, missing: true,
        from: previous.timestamp, to: point.timestamp,
        reason: "Não há amostras gravadas neste trecho do histórico consultado. O backend não informou o motivo da ausência.",
        events: events.filter(event => Date.parse(event.to) > previous.timestamp && Date.parse(event.from) < point.timestamp),
      });
    }
    result.push({ timestamp: point.timestamp, value: point.value,
      ...(point.from !== undefined ? { from: point.from } : {}), ...(point.to !== undefined ? { to: point.to } : {}),
      ...(point.reason ? { reason: point.reason } : {}) });
  }
  return result;
}
