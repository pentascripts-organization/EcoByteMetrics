import { test } from "node:test";
import assert from "node:assert/strict";
import { waitForGlobePaint } from "../src/features/home/domain/waitForGlobePaint.ts";

test("a painted globe starts immediately without an observer or API request", async () => {
  assert.equal(await waitForGlobePaint(() => true, () => { throw new Error("unneeded observer"); }, new AbortController().signal), true);
});

test("the live scene can paint while the source is retained and disconnects its observer", async () => {
  let painted = false, disposed = 0;
  let notify = () => {};
  const result = waitForGlobePaint(() => painted, check => { notify = check; return () => { disposed++; }; }, new AbortController().signal);
  painted = true;
  notify();
  assert.equal(await result, true);
  assert.equal(disposed, 1);
});

test("a slow or failed WebGL scene selects the fallback after exactly 1200 ms", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let done = false, disposed = 0;
  const result = waitForGlobePaint(() => false, () => () => { disposed++; }, new AbortController().signal);
  void result.then(() => { done = true; });
  t.mock.timers.tick(1199);
  await Promise.resolve();
  assert.equal(done, false);
  t.mock.timers.tick(1);
  assert.equal(await result, false);
  assert.equal(disposed, 1);
});

test("cancelled navigation cleans up immediately and ignores a later paint", async () => {
  const controller = new AbortController();
  let notify = () => {}, disposed = 0;
  const result = waitForGlobePaint(() => false, check => { notify = check; return () => { disposed++; }; }, controller.signal);
  controller.abort();
  assert.equal(await result, false);
  notify();
  assert.equal(disposed, 1);
  assert.equal(await waitForGlobePaint(() => true, () => { throw new Error("cancelled"); }, controller.signal), false);
});

test("a synchronous readiness notification also disposes the subscription", async () => {
  let painted = false, disposed = 0;
  const result = waitForGlobePaint(() => painted, check => { painted = true; check(); return () => { disposed++; }; }, new AbortController().signal);
  assert.equal(await result, true);
  assert.equal(disposed, 1);
});
