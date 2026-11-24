import {test} from "node:test";
import assert from "node:assert/strict";
import {temporalModel} from "../src/features/monitoring/domain/temporal.ts";
import type {MonitoredService,CollectionPoint} from "../src/features/monitoring/types.ts";
const service=(id:string):MonitoredService=>({id,name:id,status:"available",country:null,city:null,region:null,cpuPercent:null,memoryGb:null,diskGb:null,networkGb:null,energyKwh:null,emissionsG:null});
const at=Date.parse("2026-11-16T12:00:00Z");
const point=(id:string,minute:number,energy=1,carbon:number|null=2):CollectionPoint=>({serviceId:id,collectedAt:new Date(at+minute*60000).toISOString(),energyKwh:energy,emissionsG:carbon,intervalSeconds:30});

test("temporal model preserves gaps, zero, partial carbon and totals",()=>{
 const data=temporalModel([point("a",0,0),point("a",2,1,null)],[service("a")],"emissions","intervals");
 assert.equal(data.lanes[0]!.cells[0]!.value,2);
 assert.equal(data.lanes[0]!.cells[1]!.value,null);
 assert.equal(data.lanes[0]!.cells.at(-1)!.partial,true);
 assert.equal(data.summary.emissionCount,1);assert.equal(data.summary.count,2);assert.equal(data.summary.energyKwh,1);
 assert.equal(temporalModel([point("a",0,0)],[service("a")],"energy","intervals").lanes[0]!.cells[0]!.value,0);
});
test("cumulative global total retains prior contribution across asynchronous lanes",()=>{
 const data=temporalModel([point("a",0),point("b",2,3)],[service("a"),service("b")],"energy","cumulative");
 assert.equal(data.peak!.value,3);assert.equal(data.totals.at(-1)!.value,4);assert.equal(data.summary.energyKwh,4);assert.equal(data.lanes[0]!.service.id,"b");
});
test("temporal model bounds geometry, deduplicates and ignores out-of-scope services",()=>{
 const points=Array.from({length:1000},(_,i)=>point("a",i*30));
 const data=temporalModel([...points,points[0]!,point("other",0)],[service("a")],"energy","intervals");
 assert(data.timestamps.length<=384);assert.equal(data.summary.count,1000);assert.equal(data.summary.energyKwh,1000);
});
test("empty and removed services preserve honest history",()=>{
 assert.equal(temporalModel([],[service("a")],"energy","intervals").peak,null);
 const data=temporalModel([point("a",0)],[{...service("a"),status:"removed"}],"energy","intervals");assert.equal(data.lanes[0]!.total,1);
});

test("long histories keep all samples and the timeline when an aggregate start is invalid", () => {
  const count = 130_000;
  const points = Array.from({ length: count }, (_, i) => point(i % 2 ? "a" : "b", i));
  points[0] = { ...points[0]!, firstCollectedAt: "invalid" };
  const data = temporalModel(points, [service("a"), service("b")], "energy", "intervals");
  assert.equal(data.first, at);
  assert.equal(data.summary.count, count);
  assert.equal(data.lanes[0]?.summary.count, count / 2);
  assert.equal(data.lanes[1]?.summary.count, count / 2);
  assert.ok(data.timestamps.length > 0);
});
