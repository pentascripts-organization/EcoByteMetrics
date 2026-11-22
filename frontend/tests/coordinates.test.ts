import { test } from "node:test";
import assert from "node:assert/strict";
import { getValidCoordinates, isValidCoordinates } from "../src/features/monitoring/domain/coordinates.ts";

test("issue 117: aceita coordenadas válidas e rejeita nulas ou fora dos limites", () => {
  assert.equal(isValidCoordinates(-23.55, -46.63), true);
  assert.equal(isValidCoordinates(0, 0), true);
  assert.equal(isValidCoordinates(null, -46.63), false);
  assert.equal(isValidCoordinates(-23.55, undefined), false);
  assert.equal(isValidCoordinates(Number.NaN, 0), false);
  assert.equal(isValidCoordinates(90.1, 0), false);
  assert.equal(isValidCoordinates(0, 180.1), false);
  assert.deepEqual(getValidCoordinates(-23.55, -46.63), { latitude: -23.55, longitude: -46.63 });
  assert.equal(getValidCoordinates(null, -46.63), null);
});
