import type {CollectionPoint, MonitoredService} from "../types.ts";
import type {DashboardMetric} from "./dashboard.ts";
import type {EvolutionMode} from "./evolution.ts";
import {mergeCollectionHistory, summarizeCollections} from "./history.ts";
export function temporalModel(history: CollectionPoint[], services: MonitoredService[], metric: DashboardMetric, mode: EvolutionMode) {
  const ids = new Set(services.map(service => service.id));
  const samples: CollectionPoint[] = [];
  const byService = new Map<string, CollectionPoint[]>();
  let first: number | null = null;
  let last: number | null = null;
  let largestBucket = 30_000;
  for (const point of mergeCollectionHistory([], history)) {
    const time = Date.parse(point.collectedAt);
    if (!ids.has(point.serviceId) || !Number.isFinite(time)) continue;
    const start = Date.parse(point.firstCollectedAt ?? point.collectedAt);
    const validStart = Number.isFinite(start) && start <= time ? start : time;
    first = Math.min(first ?? validStart, validStart);
    last = Math.max(last ?? time, time);
    largestBucket = Math.max(largestBucket, (point.bucketSeconds ?? 30) * 1000);
    samples.push(point);
    const own = byService.get(point.serviceId);
    if (own) own.push(point);
    else byService.set(point.serviceId, [point]);
  }
  const span = (last ?? 0) - (first ?? 0);
  const base = Math.max(span <= 3600_000 ? 30_000 : span <= 86400_000 ? 300_000 : 3600_000, largestBucket);
  const interval=base*Math.max(1,Math.ceil((span/base+1)/384));
  const start=Math.floor((first??0)/interval)*interval;
  const count=first===null?0:Math.floor(((last??start)-start)/interval)+1;
  const timestamps=Array.from({length:count},(_,i)=>start+i*interval);
  const lanes=services.map(service=>{
    const own = byService.get(service.id) ?? [];
    const buckets=new Map<number,CollectionPoint[]>();
    for(const p of own){const i=Math.floor((Date.parse(p.collectedAt)-start)/interval);const group=buckets.get(i)??[];group.push(p);buckets.set(i,group);}
    let accumulated: number | null = null, recorded=0, calculated=0;
    const cells=timestamps.map((timestamp,i)=>{
      const points=buckets.get(i)??[], summary=summarizeCollections(points);
      recorded+=summary.count;calculated+=summary.emissionCount;
      const available=metric==="energy"?summary.energyKwh:summary.emissionsG;
      if (available !== null) accumulated = (accumulated ?? 0) + available;
      return {timestamp,value:mode==="cumulative"?accumulated:available,intervalValue:available,summary,points,partial:metric==="emissions"&&(mode==="cumulative"?calculated<recorded:summary.emissionCount<summary.count)};
    });
    const summary=summarizeCollections(own);
    return {service,cells,summary,total:metric==="energy"?summary.energyKwh:summary.emissionsG};
  }).sort((a,b)=>(b.total??-1)-(a.total??-1)||a.service.id.localeCompare(b.service.id));
  let accumulated: number | null = null;
  const totals=timestamps.map((timestamp,i)=>{
    const values=lanes.map(l=>l.cells[i]!.intervalValue).filter((v):v is number=>v!==null);
    const intervalValue = values.length ? values.reduce((sum, value) => sum + value, 0) : null;
    if (intervalValue !== null) accumulated = (accumulated ?? 0) + intervalValue;
    return {timestamp,intervalValue,value:mode==="cumulative"?accumulated:intervalValue};
  });
  const peak=totals.reduce<{timestamp:number;value:number}|null>((best,p)=>p.intervalValue!==null&&(!best||p.intervalValue>best.value)?{timestamp:p.timestamp,value:p.intervalValue}:best,null);
  return {samples,lanes,timestamps,first,last,interval,totals,peak,summary:summarizeCollections(samples)};
}
export type TemporalModel=ReturnType<typeof temporalModel>;
