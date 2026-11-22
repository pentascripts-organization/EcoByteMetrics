import assert from "node:assert/strict";
import test from "node:test";
import { comparisonSeries } from "../src/features/monitoring/domain/comparisonSeries.ts";
import type { CollectionPoint } from "../src/features/monitoring/types.ts";

test("aligns selected readings, excludes window start, deduplicates and keeps zero, partial and gaps distinct", () => {
  const start = Date.UTC(2026, 10, 22, 13);
  const point = (serviceId: string, offset: number, energyKwh: number, emissionsG: number | null): CollectionPoint => ({
    serviceId, collectedAt: new Date(start + offset).toISOString(), energyKwh, emissionsG,
  });
  const zero = point("a", 20_000, 0, 0);
  const result = comparisonSeries([
    point("a", 0, 99, 99), zero, zero, point("b", 23_000, 1, null),
    point("a", 25_000, 0, null), point("a", 90_000, 2, 3), point("ignored", 20_000, 10, 10),
    point("b", 90_001, 25, 25),
  ], ["a", "b"], start, start + 90_000);
  assert.deepEqual(result.times, [start, start + 30_000, start + 60_000, start + 90_000]);
  assert.equal(result.series.get("a")?.get(start)?.energyKwh, 0);
  assert.equal(result.series.get("a")?.get(start)?.emissionsG, 0);
  assert.equal(result.series.get("a")?.get(start)?.count, 2);
  assert.equal(result.series.get("a")?.get(start)?.emissionCount, 1);
  assert.equal(result.series.get("b")?.get(start)?.emissionsG, null);
  assert.equal(result.series.get("b")?.has(start + 90_000), false);
  assert.equal(result.series.get("a")?.has(start + 30_000), false);
  assert.equal(result.series.get("a")?.get(start + 90_000)?.emissionsG, 3);
  assert.equal(result.series.has("ignored"), false);
});
