import { test } from "node:test";
import assert from "node:assert/strict";
import type { MonitoredService, MonitoringSnapshot } from "../src/features/monitoring/types.ts";
import { mergeMonitoringSnapshot, markStaleServices, isMonitoringPath } from "../src/features/monitoring/domain/snapshot.ts";

const at = (second: number) => new Date(Date.UTC(2026, 9, 23, 12, 0, second)).toISOString();
const service = (changes: Partial<MonitoredService> = {}): MonitoredService => ({
  id: "a", name: "App", status: "available", country: null, region: null, city: null,
  cpuPercent: 10, memoryGb: 1, diskGb: 2, networkGb: 3, energyKwh: 0.001, emissionsG: 1,
  collectionIntervalSeconds: 30, lastCollectionAt: at(0), ...changes,
});
const snapshot = (services = [service()]): MonitoringSnapshot => ({
  services, regions: [], history: [], totalEnergyKwh: null, totalEmissionsG: null,
  lastCollectionAt: at(0), discoveryUpdatedAt: at(1), discoveryComplete: true,
});

test("monitoramento atualiza em ambas as páginas, inclusive com barra final", () => {
  for (const path of ["/dashboard", "/dashboard/", "/comparar", "/comparar/"]) assert.equal(isMonitoringPath(path), true);
  for (const path of ["/", "/login", "/cadastro", "/gerenciamento", "/dashboard/outra"]) assert.equal(isMonitoringPath(path), false);
});

test("falha por aplicação preserva a última coleta válida sem criar amostras", () => {
  const previous = snapshot();
  const failed = snapshot([service({ status: "unavailable", cpuPercent: null, energyKwh: null, emissionsG: null, lastCollectionAt: null })]);
  const merged = mergeMonitoringSnapshot(previous, failed, at(30));
  assert.equal(merged.services[0]!.status, "unavailable");
  assert.equal(merged.services[0]!.cpuPercent, 10);
  assert.equal(merged.services[0]!.lastCollectionAt, at(0));
  assert.match(merged.services[0]!.statusMessage!, /última coleta válida/);
  assert.equal(merged.history.length, 0);
  assert.equal(merged.observations![0]!.samples.length, 0);
  assert.equal(merged.refreshedAt, at(30));
  assert.equal(previous.services[0]!.status, "available");
});

test("recuperação substitui dados preservados e coleta anterior não regride recursos", () => {
  const previous = snapshot([service({ lastCollectionAt: at(30) })]);
  const older = mergeMonitoringSnapshot(previous, snapshot([service({ cpuPercent: 5 })]), at(31));
  assert.equal(older.services[0]!.cpuPercent, 10);
  assert.equal(older.services[0]!.status, "stale");
  const recovered = mergeMonitoringSnapshot(older, snapshot([service({ cpuPercent: 0, lastCollectionAt: at(60) })]), at(61));
  assert.equal(recovered.services[0]!.cpuPercent, 0);
  assert.equal(recovered.services[0]!.status, "available");
});

test("descoberta parcial não remove aplicações; remoção confirmada não reaproveita recursos", () => {
  const previous = snapshot();
  const partial = mergeMonitoringSnapshot(previous, { ...snapshot([]), discoveryComplete: false }, at(30));
  assert.equal(partial.services[0]!.status, "available");
  const removed = mergeMonitoringSnapshot(previous, snapshot([]), at(30));
  assert.equal(removed.services[0]!.status, "removed");
  assert.equal(removed.services[0]!.energyKwh, null);
  assert.equal(removed.services[0]!.lastCollectionAt, at(0));
});

test("falha de conexão envelhece os dados sem afirmar que o serviço caiu", () => {
  const services = [service(), service({ id: "b", status: "removed" })];
  const stale = markStaleServices(services, Date.parse(at(120)));
  assert.equal(stale[0]!.status, "stale");
  assert.equal(stale[0]!.energyKwh, 0.001);
  assert.equal(stale[1]!.status, "removed");
});

test("consultas bem-sucedidas preservam pausas e falhas anteriores no diagnóstico da sessão", () => {
  const event = { from: at(1), to: at(20), kind: "request-failed" as const };
  const previous = { ...snapshot(), collectionEvents: [event] };
  const repeated = mergeMonitoringSnapshot(previous, snapshot(), at(31), at(30));
  assert.deepEqual(repeated.collectionEvents, [event, { from: at(30), to: at(31), kind: "no-new-samples", serviceIds: ["a"] }]);
  const recovered = mergeMonitoringSnapshot(repeated, snapshot([service({ lastCollectionAt: at(60) })]), at(61), at(60));
  assert.deepEqual(recovered.collectionEvents, repeated.collectionEvents);
});
