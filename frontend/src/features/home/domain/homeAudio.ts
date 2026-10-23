export function createHomeAudio(music: HTMLAudioElement, createContext = () => new AudioContext()) {
  music.loop = true;
  music.volume = .22;
  let wanted = false, disposed = false, revision = 0, lastClick = -Infinity;
  let context: AudioContext | null = null;
  const taps = new Set<AudioBufferSourceNode>();
  const stopTaps = () => { for (const tap of taps) tap.stop(); taps.clear(); };
  return {
    async setPlaying(value: boolean) {
      if (disposed) return false;
      if (value && wanted && !music.paused) return true;
      wanted = value;
      const current = ++revision;
      if (!value) {
        music.pause(); stopTaps();
        if (context?.state === "running") await context.suspend();
        return false;
      }
      try { await music.play(); }
      catch (error) {
        if (error instanceof Error && error.name === "NotAllowedError") return false;
        if (disposed || current !== revision) return false;
        throw error;
      }
      if (disposed || !wanted) { music.pause(); return false; }
      return current === revision && !music.paused;
    },
    setVolume(value: number) { music.volume = Math.max(0, Math.min(1, value)); },
    interact() {
      const now = performance.now();
      if (!wanted || disposed || music.paused || now - lastClick < 140) return;
      lastClick = now;
      // A short, quiet filtered tap has no pitch or notification-like chime.
      try {
        context ??= createContext();
        const ctx = context;
        void ctx.resume().then(() => {
          if (disposed || !wanted || music.paused) return;
          const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .018), ctx.sampleRate);
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * .0025));
          const source = ctx.createBufferSource(); source.buffer = buffer;
          const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1100;
          const gain = ctx.createGain(); gain.gain.value = music.volume * .035;
          source.connect(filter).connect(gain).connect(ctx.destination);
          taps.add(source);
          source.onended = () => { taps.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
          source.start();
        }).catch(() => {});
      } catch { /* Music remains available if interaction audio is unsupported. */ }
    },
    dispose() {
      disposed = true; wanted = false; revision++; music.pause(); stopTaps();
      music.removeAttribute("src"); music.load();
      void context?.close().catch(() => {});
    },
  };
}
