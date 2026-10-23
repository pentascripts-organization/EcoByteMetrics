import { test } from "node:test";
import assert from "node:assert/strict";
import { createHomeAudio } from "../src/features/home/domain/homeAudio.ts";

function setupAudio() {
  let plays = 0, pauses = 0, taps = 0, contexts = 0;
  const music = {
    loop: false, volume: 1, paused: true,
    async play() { plays++; this.paused = false; },
    pause() { pauses++; this.paused = true; },
    removeAttribute() {}, load() {},
  };
  const node = () => ({ connect<T>(target: T) { return target; }, disconnect() {} });
  const context = {
    sampleRate: 48000, state: "running", destination: node(),
    async resume() {}, async suspend() { this.state = "suspended"; }, async close() { this.state = "closed"; },
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    createBufferSource: () => ({ ...node(), buffer: null, onended: null, start() { taps++; }, stop() {} }),
    createBiquadFilter: () => ({ ...node(), type: "", frequency: { value: 0 } }),
    createGain: () => ({ ...node(), gain: { value: 0 } }),
  };
  const audio = createHomeAudio(music as unknown as HTMLAudioElement, () => { contexts++; return context as unknown as AudioContext; });
  return { audio, music, context, counts: () => ({ plays, pauses, taps, contexts }) };
}

test("recorded music loops quietly, accepts autoplay and respects mute and disposal", async () => {
  const { audio, music, context, counts } = setupAudio();
  assert.equal(music.loop, true);
  assert.equal(music.volume, .22);
  assert.equal(await audio.setPlaying(true), true);
  assert.equal(music.paused, false);
  await audio.setPlaying(true);
  assert.equal(counts().plays, 1);
  audio.interact();
  await Promise.resolve();
  assert.equal(counts().taps, 1);
  audio.setVolume(2); assert.equal(music.volume, 1);
  audio.setVolume(-1); assert.equal(music.volume, 0);
  await audio.setPlaying(false);
  assert.equal(music.paused, true);
  assert.equal(context.state, "suspended");
  const muted = counts();
  audio.interact(); await Promise.resolve();
  assert.deepEqual(counts(), muted);
  audio.dispose();
  assert.equal(context.state, "closed");
  assert.equal(await audio.setPlaying(true), false);
});

test("blocked autoplay can be retried on a user gesture without substituting a synth track", async () => {
  const { audio, music, counts } = setupAudio();
  const play = music.play.bind(music);
  music.play = async () => { const error = new Error("gesture required"); error.name = "NotAllowedError"; throw error; };
  assert.equal(await audio.setPlaying(true), false);
  assert.equal(music.paused, true);
  assert.equal(counts().contexts, 0);
  music.play = play;
  assert.equal(await audio.setPlaying(true), true);
  assert.equal(music.paused, false);
  audio.dispose();
});

test("a delayed play cannot restart music after mute or navigation", async () => {
  for (const dispose of [false, true]) {
    const { audio, music } = setupAudio();
    let finish: () => void = () => {};
    music.play = () => new Promise<void>(resolve => { finish = () => { music.paused = false; resolve(); }; });
    const pending = audio.setPlaying(true);
    if (dispose) audio.dispose(); else await audio.setPlaying(false);
    finish();
    assert.equal(await pending, false);
    assert.equal(music.paused, true);
    audio.dispose();
  }
});
