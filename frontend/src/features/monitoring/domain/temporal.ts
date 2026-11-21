import type {CollectionPoint, MonitoredService} from "../types.ts";
import type {DashboardMetric} from "./dashboard.ts";
import type {EvolutionMode} from "./evolution.ts";
import {mergeCollectionHistory, summarizeCollections} from "./history.ts";
export function temporalModel(history: CollectionPoint[], services: MonitoredService[], metric: DashboardMetric, mode: EvolutionMode) {
  const ids=new Set(services.map(s=>s.id));
  const samples=mergeCollectionHistory([],history).filter(p=>ids.has(p.serviceId)&&Number.isFinite(Date.parse(p.collectedAt)));
  const times=samples.map(p=>Date.parse(p.collectedAt));
  const first=times.length?Math.min(...samples.map(p=>Date.parse(p.firstCollectedAt??p.collectedAt))):null, last=times.length?Math.max(...times):null;
  const span=(last??0)-(first??0);
  const base=Math.max(span<=3600000?30000:span<=86400000?300000:3600000,...samples.map(p=>(p.bucketSeconds??30)*1000));
  const interval=base*Math.max(1,Math.ceil((span/base+1)/384));
  const start=Math.floor((first??0)/interval)*interval;
  const count=first===null?0:Math.floor(((last??start)-start)/interval)+1;
  const timestamps=Array.from({length:count},(_,i)=>start+i*interval);
  const lanes=services.map(service=>{
    const own=samples.filter(p=>p.serviceId===service.id);
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
