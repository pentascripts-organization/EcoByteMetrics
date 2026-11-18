import type { DashboardMetric } from "./dashboard.ts";
import type { TemporalModel } from "./temporal.ts";
import type { EvolutionPoint } from "./evolution.ts";

export function intervalImpactPoints(
  model: TemporalModel,
  metric: DashboardMetric,
): EvolutionPoint[] {
  return model.timestamps.map((timestamp, index) => {
    let sampleCount = 0;
    let emissionCount = 0;
    let energyKwh = 0;
    let emissionsG = 0;

    for (const lane of model.lanes) {
      const summary = lane.cells[index]!.summary;
      sampleCount += summary.count;
      emissionCount += summary.emissionCount;
      energyKwh += summary.energyKwh ?? 0;
      emissionsG += summary.emissionsG ?? 0;
    }

    const hasSamples = sampleCount > 0;
    const hasCarbon = emissionCount > 0;
    const missingKind = !hasSamples
      ? "samples"
      : metric === "emissions" && !hasCarbon
        ? "carbon"
        : undefined;
    const value = metric === "energy"
      ? hasSamples ? energyKwh : null
      : hasCarbon ? emissionsG : null;
    const partial = metric === "emissions" && hasCarbon && emissionCount < sampleCount;

    return {
      timestamp,
      value,
      gap: false,
      from: timestamp,
      to: timestamp + model.interval,
      intervalFrom: timestamp,
      intervalTo: timestamp + model.interval,
      energyKwh: hasSamples ? energyKwh : null,
      emissionsG: hasCarbon ? emissionsG : null,
      sampleCount,
      emissionCount,
      partial,
      missingKind,
      ...(missingKind === "samples"
        ? { reason: "Não há leituras registradas neste intervalo." }
        : missingKind === "carbon"
          ? { reason: "As leituras não possuem fator de carbono disponível." }
          : partial
            ? { reason: `Cálculo parcial: ${emissionCount} de ${sampleCount} amostras possuem fator de carbono.` }
            : {}),
    };
  });
}
