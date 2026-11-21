import assert from "node:assert/strict";
import test from "node:test";
import { mergeCollectionHistory, summarizeCollections } from "../src/features/monitoring/domain/history.ts";
import { evolutionData } from "../src/features/monitoring/domain/evolution.ts";
import { mergeMonitoringSnapshot } from "../src/features/monitoring/domain/snapshot.ts";
import type { MonitoringSnapshot } from "../src/features/monitoring/types.ts";

test("agregados do banco preservam contagens, energia e cobertura parcial sem inventar emissão zero", () => {
  const history = [{ serviceId: "a", collectedAt: "2026-10-30T23:00:00Z", energyKwh: 1, emissionsG: 5,
    intervalSeconds: 90, sampleCount: 3, emissionCount: 1, bucketSeconds: 300 }];
  const totals = summarizeCollections(history);
  assert.equal(totals.count, 3);
  assert.equal(totals.emissionCount, 1);
  assert.equal(totals.energyKwh, 1);
  assert.equal(totals.emissionsG, 5);
  assert.equal(totals.emissionsPerHourG, null);
  assert.equal(evolutionData(history, "emissions", "intervals").points[0].value, 5);
  assert.match(evolutionData(history, "emissions", "intervals").points[0].reason!, /1 de 3 amostras/);
  assert.equal(evolutionData(history, "energy", "intervals").points[0].value, 1);
  assert.equal(evolutionData(history, "energy", "intervals").intervalMs, 300_000);
});

test("emissões recuperadas mantêm o valor e a cobertura da mesma amostra", () => {
  const missing = {
    serviceId: "a", collectedAt: "2026-10-30T23:00:00Z", energyKwh: 1,
    emissionsG: null, intervalSeconds: 90, sampleCount: 3, emissionCount: 0,
  };
  const recovered = { ...missing, emissionsG: 5, emissionCount: 2 };
  const summary = summarizeCollections(mergeCollectionHistory([missing], [recovered]));
  assert.equal(summary.emissionsG, 5);
  assert.equal(summary.emissionCount, 2);
  assert.equal(summary.count, 3);
  assert.equal(missing.emissionCount, 0);
});

test("consulta persistida substitui os registros do navegador e não cria observações ou pausas locais", () => {
  const first: MonitoringSnapshot = {source: "database", historyPeriod: "7d", services: [], regions: [], observations: [],
    history: [{serviceId: "a", collectedAt: "2026-10-30T22:00:00Z", energyKwh: 5, emissionsG: null}],
    totalEnergyKwh: 5, totalEmissionsG: null, lastCollectionAt: "2026-10-30T22:00:00Z"};
  const incoming = {...first, history: [], totalEnergyKwh: null};
  const result = mergeMonitoringSnapshot(first, incoming, "2026-10-30T23:00:00Z");
  assert.deepEqual(result.history, []);
  assert.deepEqual(result.observations, []);
  assert.equal(result.totalEnergyKwh, null);
  assert.equal(result.refreshedAt, "2026-10-30T23:00:00Z");
});
