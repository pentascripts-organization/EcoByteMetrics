import type { CollectionPoint, MonitoredService } from "../types.ts";
import { collectionRange, latestCollections, mergeCollectionHistory, summarizeCollections } from "./history.ts";

function summarizeResources(points: CollectionPoint[]) {
  let duration = 0;
  let cpu = 0;
  let memory = 0;
  let network = 0;

  for (const point of points) {
    const resources = point.resources;
    if (!resources || !Number.isFinite(resources.durationSeconds) || resources.durationSeconds <= 0 ||
      !Number.isFinite(resources.cpuPercent) || !Number.isFinite(resources.memoryGb) || !Number.isFinite(resources.networkGb)) continue;

    duration += resources.durationSeconds;
    cpu += resources.cpuPercent * resources.durationSeconds;
    memory += resources.memoryGb * resources.durationSeconds;
    network += resources.networkGb * resources.durationSeconds;
  }

  return duration > 0
    ? { cpuPercent: cpu / duration, memoryGb: memory / duration, networkGb: network / duration }
    : { cpuPercent: null, memoryGb: null, networkGb: null };
}

export function compareApplications(services: MonitoredService[], history: CollectionPoint[], ids: string[], start: number | null, end: number | null, latest = false) {
  const selected = new Set(ids);
  const samples = new Map<string, CollectionPoint[]>();
  for (const point of mergeCollectionHistory([], latest ? latestCollections(services) : history)) {
    const time = Date.parse(point.collectedAt);
    if (!selected.has(point.serviceId) || (!latest && (start === null || end === null || time <= start || time > end))) continue;
    const group = samples.get(point.serviceId) ?? [];
    group.push(point);
    samples.set(point.serviceId, group);
  }
  return services.filter(service => selected.has(service.id)).map(service => {
    const points = samples.get(service.id) ?? [];
    const summary = summarizeCollections(points);
    const range = collectionRange(points);
    const resources = latest
      ? { cpuPercent: service.cpuPercent, memoryGb: service.memoryGb, networkGb: service.networkGb }
      : summarizeResources(points);
    return {
      service, ...summary, resources,
      first: range.first,
      last: range.last,
    };
  });
}
