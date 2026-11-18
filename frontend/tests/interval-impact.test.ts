import { test } from "node:test";
import assert from "node:assert/strict";
import { intervalImpactPoints } from "../src/features/monitoring/domain/intervalImpact.ts";
import { temporalModel } from "../src/features/monitoring/domain/temporal.ts";
import type { CollectionPoint, MonitoredService } from "../src/features/monitoring/types.ts";

const start = Date.parse("2026-11-16T12:00:00Z");
const service = (id: string): MonitoredService => ({ id, name: id, status: "available", country: null, city: null, region: null, cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null });
const point = (serviceId: string, seconds: number, energyKwh: number, emissionsG: number | null): CollectionPoint => ({ serviceId, collectedAt: new Date(start + seconds * 1000).toISOString(), energyKwh, emissionsG, intervalSeconds: 30 });

test("interval impact aggregates filtered services and preserves rises and falls", () => {
  const services = [service("a"), service("b")];
  const history = [
    point("a", 0, .1, .1), point("b", 0, .3, .3),
    point("a", 30, .2, .2), point("b", 30, .6, .6),
    point("a", 60, .05, .05), point("b", 60, .15, .15),
    point("outside-filter", 0, 99, 99),
  ];
  const model = temporalModel(history, services, "emissions", "intervals");
  const series = intervalImpactPoints(model, "emissions").filter(item => item.value !== null).map(item => item.value);
  assert.deepEqual(series, [.4, .8, .2]);
});

test("interval impact distinguishes zero, partial coverage, missing carbon, and missing samples", () => {
  const services = [service("carbon"), service("unknown")];
  const model = temporalModel([
    point("carbon", 0, 0, 0), point("unknown", 0, .2, null),
    point("carbon", 60, .4, 2), point("unknown", 60, .3, null),
    point("unknown", 120, .5, null),
    point("carbon", 180, .6, 3),
  ], services, "emissions", "intervals");
  const points = intervalImpactPoints(model, "emissions");
  const at = (seconds: number) => points.find(item => item.timestamp === start + seconds * 1000)!;
  assert.equal(at(0).value, 0);
  assert.equal(at(0).sampleCount, 2);
  assert.equal(at(0).emissionCount, 1);
  assert.equal(at(0).partial, true);
  assert.equal(at(60).value, 2);
  assert.equal(at(60).partial, true);
  assert.equal(at(120).value, null);
  assert.equal(at(120).missingKind, "carbon");
  assert.equal(at(180).value, 3);
  assert.equal(at(90).value, null);
  assert.equal(at(90).missingKind, "samples");
});
