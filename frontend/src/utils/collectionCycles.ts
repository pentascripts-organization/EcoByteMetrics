import type { CollectionPoint } from "../types/monitoring";

const cycleKey = (point: CollectionPoint) =>
  point.cycleId ?? point.cycleAt ?? point.collectedAt;

export function aggregateCollections(
  points: CollectionPoint[],
  metric: "energy" | "emissions",
) {
  const cycles = new Map<
    string,
    { id: string; collectedAt: string; value: number }
  >();
  for (const point of points) {
    const value = metric === "energy" ? point.energyKwh : point.emissionsG;
    if (value === null) continue;
    const id = cycleKey(point);
    const cycle = cycles.get(id);
    if (!cycle) cycles.set(id, { id, collectedAt: point.collectedAt, value });
    else {
      cycle.value += value;
      if (Date.parse(point.collectedAt) > Date.parse(cycle.collectedAt))
        cycle.collectedAt = point.collectedAt;
    }
  }
  return [...cycles.values()];
}

export function commonCollectionPoints(
  points: CollectionPoint[],
  serviceIds: string[],
) {
  const selected = new Set(serviceIds);
  if (!selected.size) return [];
  const cycles = new Map<string, Set<string>>();
  for (const point of points) {
    if (!selected.has(point.serviceId)) continue;
    const key = cycleKey(point);
    const ids = cycles.get(key) ?? new Set<string>();
    ids.add(point.serviceId);
    cycles.set(key, ids);
  }
  return points.filter(
    (point) =>
      selected.has(point.serviceId) &&
      cycles.get(cycleKey(point))?.size === selected.size,
  );
}
