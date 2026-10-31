import type { CollectionPoint, MonitoredService } from "../types.ts";
import { collectionRange, mergeCollectionHistory, summarizeCollections } from "./history.ts";

export function compareApplications(services: MonitoredService[], history: CollectionPoint[], ids: string[], start: number | null, end: number | null) {
  const selected = new Set(ids);
  const samples = new Map<string, CollectionPoint[]>();
  for (const point of mergeCollectionHistory([], history)) {
    const time = Date.parse(point.collectedAt);
    if (!selected.has(point.serviceId) || start === null || end === null || time <= start || time > end) continue;
    const group = samples.get(point.serviceId) ?? [];
    group.push(point);
    samples.set(point.serviceId, group);
  }
  return services.filter(service => selected.has(service.id)).map(service => {
    const points = samples.get(service.id) ?? [];
    const summary = summarizeCollections(points);
    const range = collectionRange(points);
    return {
      service, ...summary,
      first: range.first,
      last: range.last,
    };
  });
}
