import type { CollectionPoint } from '../types/monitoring';

export function summarizeCollections(points: CollectionPoint[]) {
  const emissionPoints = points.filter((point) => point.emissionsG !== null);
  const seconds = points.reduce((sum, point) => sum + (point.intervalSeconds ?? 0), 0);
  const energyKwh = points.length ? points.reduce((sum, point) => sum + point.energyKwh, 0) : null;
  const emissionsG = emissionPoints.length ? emissionPoints.reduce((sum, point) => sum + point.emissionsG!, 0) : null;
  return {
    energyKwh, emissionsG, count: points.length, emissionCount: emissionPoints.length, seconds,
    energyPerHourKwh: seconds > 0 && energyKwh !== null ? energyKwh * 3600 / seconds : null,
    emissionsPerHourG: seconds > 0 && emissionPoints.length === points.length && emissionsG !== null ? emissionsG * 3600 / seconds : null,
  };
}

export function commonCollectionPoints(points: CollectionPoint[], serviceIds: string[]) {
  if (!serviceIds.length) return [];
  const cycles = new Map<string, Set<string>>();
  for (const point of points) {
    if (!serviceIds.includes(point.serviceId)) continue;
    const ids = cycles.get(point.collectedAt) ?? new Set<string>();
    ids.add(point.serviceId);
    cycles.set(point.collectedAt, ids);
  }
  return points.filter((point) => serviceIds.includes(point.serviceId) && cycles.get(point.collectedAt)?.size === serviceIds.length);
}
