import {test} from "node:test";
import assert from "node:assert/strict";
import {applicationImpactTreemap} from "../src/features/monitoring/domain/applicationImpact.ts";
import {temporalModel} from "../src/features/monitoring/domain/temporal.ts";
import type {CollectionPoint,MonitoredService} from "../src/features/monitoring/types.ts";

const service=(id:string,country="Canada"):MonitoredService=>({id,name:`App ${id}`,status:"available",country,city:null,region:"Ontario",cpuPercent:null,memoryGb:null,diskGb:null,networkGb:null,energyKwh:null,emissionsG:null});
const point=(serviceId:string,minute:number,energy:number,emissionsG:number|null):CollectionPoint=>({serviceId,collectedAt:new Date(Date.parse("2026-11-16T12:00:00Z")+minute*60_000).toISOString(),energyKwh:energy,emissionsG,intervalSeconds:30});

test("treemap uses selected services and respects the cumulative mode",()=>{
  const model=temporalModel([point("a",0,2,4),point("b",0,1,2),point("a",2,3,6)],[service("a"),service("b"),service("c")],"emissions","cumulative");
  const result=applicationImpactTreemap(model.lanes.filter(lane=>lane.service.id!=="b"),model.timestamps.length-1,"cumulative");
  assert.equal(result.data.length,1);
  assert.equal(result.data[0]?.serviceId,"a");
  assert.equal(result.data[0]?.value,10);
  assert.equal(result.data[0]?.category,"Canada");
  assert.equal(result.total,10);
});

test("treemap tracks missing and zero impact separately",()=>{
  const model=temporalModel([point("zero",0,0,0),point("missing",0,1,null)],[service("zero"),service("missing")],"emissions","intervals");
  const result=applicationImpactTreemap(model.lanes,model.timestamps.length-1,"intervals");
  assert.deepEqual(result.data,[]);
  assert.equal(result.zeroCount,1);
  assert.equal(result.missingCount,1);
  assert.equal(result.sampleCount,2);
  assert.equal(result.emissionCount,1);
});
