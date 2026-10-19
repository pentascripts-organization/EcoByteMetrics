import type { CollectionPoint } from "../types/monitoring";

export function mergeCollectionHistory(
  previous: CollectionPoint[],
  incoming: CollectionPoint[],
) {
  const seen = new Map<string, number>();
  const history: CollectionPoint[] = [];
  for (const point of [...previous, ...incoming]) {
    // Identificação de amostras repetidas no cache do backend.
    const key = JSON.stringify([point.serviceId, Date.parse(point.collectedAt)]);
    const index = seen.get(key);
    if (index === undefined) {
      seen.set(key, history.length);
      history.push(point);
      continue;
    }
    const existing = history[index]!;
    // Um fator recuperado pode completar as emissões da mesma amostra.
    if (existing.emissionsG === null && point.emissionsG !== null &&
      existing.energyKwh === point.energyKwh &&
      existing.intervalSeconds === point.intervalSeconds &&
      existing.regionCode === point.regionCode)
      history[index] = { ...existing, emissionsG: point.emissionsG };
  }
  return history;
}

export function summarizeCollections(points: CollectionPoint[]) {
  let energy = 0,
    emissions = 0,
    seconds = 0,
    emissionCount = 0;
  for (const point of points) {
    energy += point.energyKwh;
    seconds += point.intervalSeconds ?? 0;
    if (point.emissionsG !== null) {
      emissions += point.emissionsG;
      emissionCount++;
    }
  }
  const energyKwh = points.length && Number.isFinite(energy) ? energy : null;
  const emissionsG =
    emissionCount && Number.isFinite(emissions) ? emissions : null;
  return {
    energyKwh,
    emissionsG,
    count: points.length,
    emissionCount,
    seconds,
    energyPerHourKwh:
      seconds > 0 && energyKwh !== null ? (energyKwh * 3600) / seconds : null,
    emissionsPerHourG:
      seconds > 0 && emissionCount === points.length && emissionsG !== null
        ? (emissionsG * 3600) / seconds
        : null,
  };
}
