import type { TemporalModel } from "./temporal.ts";
import type { EvolutionMode } from "./evolution.ts";

export function applicationImpactTreemap(lanes: TemporalModel["lanes"], index: number, mode: EvolutionMode) {
  let sampleCount = 0;
  let emissionCount = 0;
  let total = 0;
  let zeroCount = 0;
  let missingCount = 0;

  const data = lanes.flatMap(lane => {
    const summary = lane.cells[index]?.summary;
    if (!summary) return [];
    const observed = mode === "cumulative" ? lane.cells.slice(0, index + 1) : [lane.cells[index]!];
    sampleCount += observed.reduce((sum, cell) => sum + cell.summary.count, 0);
    emissionCount += observed.reduce((sum, cell) => sum + cell.summary.emissionCount, 0);
    const value = lane.cells[index]?.value;
    if (value == null) {
      missingCount++;
      return [];
    }
    if (value === 0) {
      zeroCount++;
      return [];
    }
    if (value < 0) return [];
    total += value;
    return [{
      serviceId: lane.service.id,
      application: lane.service.name,
      category: lane.service.country || lane.service.region || "Localização desconhecida",
      region: lane.service.region,
      value,
    }];
  }).sort((a, b) => b.value - a.value);

  return { data, total, sampleCount, emissionCount, zeroCount, missingCount };
}
