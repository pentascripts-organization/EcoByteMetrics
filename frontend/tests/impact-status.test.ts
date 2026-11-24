import { test } from "node:test";
import assert from "node:assert/strict";
import { impactTone } from "../src/features/monitoring/domain/impactStatus.ts";

test("issue 132: classifica estados em cores semafóricas", () => {
  assert.equal(impactTone("available"), "green");
  assert.equal(impactTone("stale"), "yellow");
  assert.equal(impactTone("no-metrics"), "yellow");
  assert.equal(impactTone("unavailable"), "red");
  assert.equal(impactTone("removed"), "muted");
});
