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
