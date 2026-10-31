import assert from "node:assert/strict";
import test from "node:test";
import pool from "../src/db/connection";
import { collectOnce } from "../src/modules/Monitoring/collector";
import { getCollectedMetricsByServiceId, getDiscoveredServices, publishCollection } from "../src/modules/Services/services.service";
import { parseHistoryQuery } from "../src/modules/Monitoring/monitoring.router";

const service = { id: "test-api", name: "Test", metrics_path: "/metrics/test-api", location: {
  region_code: "br-sp", country: "Brasil", region: "SP", city: "São Paulo", latitude: -23.55, longitude: -46.63,
} };
const sample = { collection_interval_seconds: 30, metrics: { cpu_percent: 10, memory_gb: 1, disk_gb: 2, network_gb: 3 } };

test("uma consulta de métricas alimenta SQL e cache com o mesmo instante, somente após commit", async t => {
  publishCollection([], new Map(), new Date().toISOString());
  const statements: { sql: string; values?: unknown[] }[] = [];
  let calls = 0;
  const client = {
    async query(sql: string, values?: unknown[]) {
      statements.push({ sql, values });
      if (sql === "COMMIT") assert.equal(getDiscoveredServices().length, 0);
      return { rowCount: 1, rows: [{ id_location: 1, id_service: 2 }] };
    }, release() {},
  };
  t.mock.method(pool, "connect", async () => client);
  const cycle = await collectOnce({ services: async () => [service], metrics: async () => { calls++; return sample; }, regions: async () => [] });
  assert.equal(calls, 1);
  const stored = statements.find(query => /INSERT INTO metrics/i.test(query.sql))!;
  assert.deepEqual(stored.values?.slice(1, 5), [10, 1, 2, 3]);
  assert.equal(stored.values?.[5], cycle.at);
  assert.equal(stored.values?.[7], null);
  assert.deepEqual(getCollectedMetricsByServiceId(service.id), { serviceId: service.id, metrics: sample, updatedAt: cycle.at });
  assert(statements.some(query => query.sql === "COMMIT"));
});

test("falha no banco faz rollback sem publicar uma coleta que não foi gravada", async t => {
  publishCollection([], new Map(), "2026-10-30T00:00:00Z");
  const sql: string[] = [];
  t.mock.method(pool, "connect", async () => ({
    async query(statement: string) { sql.push(statement); if (/INSERT INTO locations/i.test(statement)) throw new Error("controlled write failure"); return { rows: [], rowCount: 0 }; }, release() {},
  }));
  await assert.rejects(collectOnce({services: async () => [service], metrics: async () => sample, regions: async () => []}), /controlled write failure/);
  assert(sql.includes("ROLLBACK"));
  assert(!sql.includes("COMMIT"));
  assert.deepEqual(getDiscoveredServices(), []);
});

test("filtros de histórico exigem período permitido, data com fuso e IDs limitados", () => {
  assert.deepEqual(parseHistoryQuery({ period: "24h", until: "2026-10-30T23:00:00-03:00", service: ["billing-api", "billing-api"] }),
    {period: "24h", until: "2026-10-30T23:00:00-03:00", serviceIds: ["billing-api"]});
  for (const query of [{period: "all"}, {until: "30/10/2026"}, {until: "2026-02-30T12:00:00Z"}, {until: "2026-10-30T23:00:00"}, {service: {}}, {service: Array(101).fill("app")}])
    assert.throws(() => parseHistoryQuery(query));
});
