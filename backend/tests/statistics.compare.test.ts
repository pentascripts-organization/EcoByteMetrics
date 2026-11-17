import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { Server } from "node:http";
import express from "express";

import pool from "../src/db/connection";
import statisticRouter from "../src/modules/Statistics/statistics.router";

const originalQuery = pool.query;

let server: Server;
let base: string;
let databaseUnavailable = false;
let queries: string[] = [];

before(async () => {
  // Simula as consultas ao PostgreSQL.
  pool.query = (async (sql: string, values: unknown[]) => {
    queries.push(sql);

    if (databaseUnavailable) {
      throw new Error("controlled database failure");
    }

    const ids = values[0] as number[];
    const start = new Date(String(values[1]));
    const end = new Date(String(values[2]));

    // Neste cenário, somente os serviços 1 e 2 existem.
    const existingIds = ids.filter(id => [1, 2].includes(id));

    const rows = existingIds.map(id => ({
      id_service: id,
      name_service: `Serviço ${id}`,
      bucket_start: start,
      bucket_end: end,
      sample_count: 1,
      energy_kwh: id * 0.001,
      emissions_gco2e: id * 0.02,
    }));

    return { rows };
  }) as typeof pool.query;

  const app = express();

  app.use(express.json());
  app.use("/api/statistics", statisticRouter);

  server = app.listen(0, "127.0.0.1");

  await new Promise<void>(resolve => {
    server.once("listening", resolve);
  });

  const address = server.address();

  assert(address && typeof address !== "string");

  base = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
  databaseUnavailable = false;
  queries = [];
});

after(async () => {
  server.closeAllConnections();

  await new Promise<void>(resolve => {
    server.close(() => resolve());
  });

  pool.query = originalQuery;
  await pool.end();
});

function request(path: string) {
  return fetch(base + path);
}

test("compara dois serviços existentes e retorna HTTP 200", async () => {
  const response = await request(
    "/api/statistics/metrics/compare?ids=1,2&period=week",
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(body.period, "week");
  assert.equal(body.data.length, 2);

  assert.deepEqual(
    body.data.map((item: { id_service: number }) => item.id_service),
    [1, 2],
  );

  assert.equal(body.data[0].sample_count, 1);
  assert.equal(body.data[1].sample_count, 1);

  assert.equal(queries.length, 1);
  assert.match(queries[0]!, /ANY\(\$1::int\[\]\)/);
});

test("retorna HTTP 404 quando um dos serviços não existe", async () => {
  const response = await request(
    "/api/statistics/metrics/compare?ids=1,99&period=week",
  );

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.success, false);
  assert.match(body.message, /99/);
  assert.equal(queries.length, 1);
});

test("rejeita parâmetros inválidos com HTTP 400 sem consultar o banco", async () => {
  const invalidPaths = [
    "/api/statistics/metrics/compare?ids=1&period=week",
    "/api/statistics/metrics/compare?ids=1,1&period=week",
    "/api/statistics/metrics/compare?ids=1,abc&period=week",
    "/api/statistics/metrics/compare?ids=1,2&period=invalid",
    "/api/statistics/metrics/compare?period=week",
  ];

  for (const path of invalidPaths) {
    const response = await request(path);
    assert.equal(response.status, 400);
  }

  assert.equal(queries.length, 0);
});

test("retorna HTTP 500 quando ocorre uma falha inesperada no banco", async t => {
  databaseUnavailable = true;

  t.mock.method(console, "error", () => {});

  const response = await request(
    "/api/statistics/metrics/compare?ids=1,2&period=week",
  );

  assert.equal(response.status, 500);

  const body = await response.json();

  assert.equal(body.success, false);
  assert.equal(
    body.message,
    "Erro interno ao comparar serviços.",
  );
});
