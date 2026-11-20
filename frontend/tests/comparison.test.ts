import { test } from "node:test";
import assert from "node:assert/strict";
import { compareApplications } from "../src/features/monitoring/domain/comparison.ts";
import type { CollectionPoint, MonitoredService } from "../src/features/monitoring/types.ts";
const at = (second: number) => Date.UTC(2026, 9, 23, 12, 0, second);
const service = (id: string): MonitoredService => ({ id, name: id, status: "available", country: null, region: null, city: null, cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null });
const sample = (serviceId: string, second: number, emissionsG: number | null): CollectionPoint => ({ serviceId, collectedAt: new Date(at(second)).toISOString(), energyKwh: 0.001, emissionsG, intervalSeconds: 30 });

test("comparação usa o mesmo intervalo e expõe cobertura diferente sem duplicar cache ou seleção", () => {
  const first = sample("a", 0, 1);
  const rows = compareApplications([service("a"), service("b"), service("c")], [first, first, sample("a", 30, 2), sample("b", 30, null), sample("a", 90, 5)], ["a", "a", "b"], at(-1), at(60));
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!.count, 2);
  assert.equal(rows[0]!.energyKwh, 0.002);
  assert.equal(rows[0]!.emissionsG, 3);
  assert.equal(rows[1]!.count, 1);
  assert.equal(rows[1]!.emissionsG, null);
  assert.equal(rows[1]!.seconds, 30);
});

test("comparação distingue zero, ausência de coleta e emissões incompletas", () => {
  const rows = compareApplications([service("a"), service("b"), service("c")], [sample("a", 0, 0), sample("b", 0, 2), sample("b", 30, null)], ["a", "b", "c"], at(-1), at(60));
  assert.equal(rows[0]!.emissionsG, 0);
  assert.equal(rows[1]!.emissionsG, 2);
  assert.equal(rows[1]!.emissionCount, 1);
  assert.equal(rows[2]!.energyKwh, null);
  assert.equal(rows[2]!.first, null);
  assert.equal(compareApplications([service("a")], [sample("a", 0, 2)], ["a"], null, null)[0]!.count, 0);
});


test("última coleta usa a leitura individual, não o último bloco somado do histórico", () => {
  const a = {...service("a"), cpuPercent: 22, memoryGb: 2, networkGb: 4, energyKwh: .004, emissionsG: 2, lastCollectionAt: new Date(at(30)).toISOString()};
  const b = {...service("b"), cpuPercent: 0, memoryGb: 0, networkGb: 0, energyKwh: 0, emissionsG: 0, lastCollectionAt: new Date(at(-120)).toISOString(), status: "removed" as const};
  const history = [{...sample("a", 30, 90), energyKwh: .5, sampleCount: 10}];
  const latest = compareApplications([a,b,service("c")],history,["a","a","b","c"],at(0),at(60),true);
  assert.equal(latest[0]!.energyKwh, .004);
  assert.equal(latest[0]!.emissionsG, 2);
  assert.deepEqual(latest[0]!.resources, {cpuPercent:22,memoryGb:2,networkGb:4});
  assert.equal(latest[0]!.count, 1);
  assert.equal(latest[1]!.energyKwh, 0);
  assert.equal(latest[1]!.emissionsG, 0);
  assert.deepEqual(latest[1]!.resources, {cpuPercent:0,memoryGb:0,networkGb:0});
  assert.equal(latest[1]!.last, at(-120), "A última leitura pode ser antiga e tem seu horário preservado");
  assert.equal(latest[2]!.energyKwh, null);
  assert.equal(compareApplications([a],history,["a"],at(0),at(60))[0]!.emissionsG, 90);
  const missing = compareApplications([{...a,emissionsG:null}],history,["a"],at(0),at(60),true);
  assert.equal(missing[0]!.emissionsG,null);
});

test("historical resources use duration-weighted averages and preserve zero and missing values", () => {
  const short = {...sample("a", 0, 1), resources:{cpuPercent:20,memoryGb:1,diskGb:2,networkGb:3,durationSeconds:30}};
  const long = {...sample("a", 30, 1), resources:{cpuPercent:40,memoryGb:3,diskGb:4,networkGb:5,durationSeconds:90}};
  const zero = {...sample("b", 0, 0), resources:{cpuPercent:0,memoryGb:0,diskGb:0,networkGb:0,durationSeconds:30}};
  const rows = compareApplications([service("a"),service("b"),service("c")],[short,long,zero],["a","b","c"],at(-1),at(60));
  assert.deepEqual(rows[0]!.resources,{cpuPercent:35,memoryGb:2.5,networkGb:4.5});
  assert.deepEqual(rows[1]!.resources,{cpuPercent:0,memoryGb:0,networkGb:0});
  assert.deepEqual(rows[2]!.resources,{cpuPercent:null,memoryGb:null,networkGb:null});
});
