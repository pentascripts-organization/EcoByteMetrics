import {test} from "node:test";
import assert from "node:assert/strict";
import {temporalModel} from "../src/features/monitoring/domain/temporal.ts";
import {portalSegments,portalWindow} from "../src/features/monitoring/domain/portal.ts";
import type {MonitoredService,CollectionPoint} from "../src/features/monitoring/types.ts";
const service=(id:string):MonitoredService=>({id,name:id,status:"available",country:null,city:null,region:null,cpuPercent:null,memoryGb:null,diskGb:null,networkGb:null,energyKwh:null,emissionsG:null});
const at=Date.parse("2026-11-16T12:00:00Z");
const point=(id:string,minute:number,energy=1,carbon:number|null=2):CollectionPoint=>({serviceId:id,collectedAt:new Date(at+minute*60000).toISOString(),energyKwh:energy,emissionsG:carbon,intervalSeconds:30});

test("portal bounds its window and keeps the selected interval at both edges",()=>{
 assert.deepEqual(portalWindow(0,0),[]);
 assert.deepEqual(portalWindow(1,0),[0]);
 for(const selected of [0,4,50,99]){
  const indices=portalWindow(100,selected);
  assert.equal(indices.length,9);assert(indices.includes(selected));
  assert(indices.every(i=>i>=0&&i<100));
  assert.equal(new Set(indices).size,indices.length);
 }
});
test("portal arcs preserve contribution, partial data and missing intervals",()=>{
 const model=temporalModel([point('a',0,3),point('b',0,1),point('a',2,0)],[service('a'),service('b')],'energy','intervals');
 const arcs=portalSegments(model.lanes,0);
 assert.equal(arcs.length,2);assert.equal(arcs[0]!.length,Math.PI*1.5);
 assert(Math.abs(arcs.reduce((n,a)=>n+a.length,0)-Math.PI*2)<1e-10);
 assert.deepEqual(portalSegments(model.lanes,1),[]);
 assert.deepEqual(portalSegments(model.lanes,model.timestamps.length-1),[]);
 const partial=temporalModel([point('a',0,1,2),point('a',.1,1,null)],[service('a')],'emissions','intervals');
 assert.equal(portalSegments(partial.lanes,0)[0]!.partial,true);
});
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
