import type { CollectionPoint } from "../types.ts";
import { mergeCollectionHistory, summarizeCollections } from "./history.ts";

export function comparisonSeries(history: CollectionPoint[], ids: string[], start: number | null, end: number | null) {
  const selected = new Set(ids);
  const series = new Map(ids.map(id => [id, new Map<number, ReturnType<typeof summarizeCollections>>()]));
  if (start === null || end === null || end <= start) return { times: [], series, intervalMs: 0 };

  const samples = mergeCollectionHistory([], history).filter(point => {
    const time = Date.parse(point.collectedAt);
    return selected.has(point.serviceId) && time > start && time <= end;
  });
  if (!samples.length) return { times: [], series, intervalMs: 0 };
  let first = end;
  let last = start;
  for (const point of samples) {
    const time = Date.parse(point.collectedAt);
    first = Math.min(first, time);
    last = Math.max(last, time);
  }
  const span = last - first;
  const intervalMs = samples.reduce((interval, point) => Math.max(interval, (point.bucketSeconds ?? 0) * 1000),
    span <= 3600_000 ? 30_000 : span <= 86400_000 ? 300_000 : 3600_000);
  const times: number[] = [];
  const groups = new Map<string, Map<number, CollectionPoint[]>>();
  for (let time = Math.floor(first / intervalMs) * intervalMs; time <= last; time += intervalMs) times.push(time);
  if (times.length === 1) times.push(times[0]! + intervalMs);
  for (const point of samples) {
    const time = Math.floor(Date.parse(point.collectedAt) / intervalMs) * intervalMs;
    const buckets = groups.get(point.serviceId) ?? new Map<number, CollectionPoint[]>();
    const bucket = buckets.get(time) ?? [];
    bucket.push(point);
    buckets.set(time, bucket);
    groups.set(point.serviceId, buckets);
  }
  for (const [id, buckets] of groups) {
    for (const [time, points] of buckets) series.get(id)?.set(time, summarizeCollections(points));
  }
  return { times, series, intervalMs };
}
