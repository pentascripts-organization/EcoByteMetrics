import { test } from "node:test";
import assert from "node:assert/strict";
import { evolutionChartData } from "../src/features/monitoring/domain/chartData.ts";

test("Recharts recebe uma interrupção explícita entre períodos sem amostras", () => {
  const source = [{ timestamp: 0, value: 1, gap: true }, { timestamp: 30_000, value: 2, gap: false }, { timestamp: 120_000, value: 3, gap: true }];
  const result = evolutionChartData(source, 30_000);
  assert.deepEqual(result.map(({ timestamp, value, missing }) => ({ timestamp, value, missing })), [
    { timestamp: 0, value: 1, missing: undefined }, { timestamp: 30_000, value: 2, missing: undefined },
    { timestamp: 75_000, value: null, missing: true }, { timestamp: 120_000, value: 3, missing: undefined },
  ]);
  assert.equal(result[2]!.from, 30_000);
  assert.equal(result[2]!.to, 120_000);
  assert.match(result[2]!.reason!, /não informou o motivo/);
  assert.equal(source.length, 3);
});

test("lacunas incluem somente o contexto observado dentro do trecho", () => {
  const at = (second: number) => new Date(second * 1000).toISOString();
  const source = [{ timestamp: 0, value: 1, gap: true }, { timestamp: 120_000, value: 2, gap: true }];
  const events = [
    { from: at(30), to: at(90), kind: "tab-hidden" as const },
    { from: at(150), to: at(160), kind: "request-failed" as const },
  ];
  assert.deepEqual(evolutionChartData(source, 30_000, events)[1]!.events, [events[0]]);
});

test("o adaptador não recria a lacuna falsa removida pelo agrupamento", () => {
  assert.equal(evolutionChartData([{ timestamp: 29_800, value: 1, gap: true }, { timestamp: 60_100, value: 2, gap: false }], 30_000).filter(point => point.missing).length, 0);
});

test("uma coleta sem estimativa preserva a explicação e não esconde uma lacuna temporal seguinte", () => {
  const data = evolutionChartData([{ timestamp: 0, value: null, gap: true, reason: "Fator ausente" }, { timestamp: 120_000, value: null, gap: true, reason: "Fator ausente" }], 30_000);
  assert.equal(data.length, 3);
  assert.equal(data[0]!.reason, "Fator ausente");
  assert.equal(data[1]!.missing, true);
});

test("a adaptação preserva zero e valores incompletos sem duplicar lacunas", () => {
  assert.deepEqual(evolutionChartData([{ timestamp: 0, value: 0, gap: true }, { timestamp: 30_000, value: null, gap: true }, { timestamp: 60_000, value: 2, gap: true }], 30_000), [{ timestamp: 0, value: 0 }, { timestamp: 30_000, value: null }, { timestamp: 60_000, value: 2 }]);
  assert.deepEqual(evolutionChartData([], 30_000), []);
});

test("pontos únicos e intervalos consecutivos não ganham valores artificiais", () => {
  const source = [{ timestamp: 1000, value: 0.00001, gap: true }, { timestamp: 31_000, value: 0.00002, gap: false }];
  assert.equal(evolutionChartData(source, 30_000).length, 2);
  assert.deepEqual(evolutionChartData(source.slice(0, 1), 30_000), [{ timestamp: 1000, value: 0.00001 }]);
});
