export function waitForGlobePaint(isPainted: () => boolean, observe: (check: () => void) => () => void, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (isPainted()) return Promise.resolve(true);
  return new Promise(resolve => {
    let finished = false;
    let disconnect = () => {};
    const finish = (painted: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      disconnect();
      signal.removeEventListener("abort", abort);
      resolve(painted);
    };
    const abort = () => finish(false);
    const check = () => { if (isPainted()) finish(true); };
    const timer = setTimeout(() => finish(false), 1200);
    signal.addEventListener("abort", abort, {once:true});
    disconnect = observe(check);
    if (finished) disconnect(); else check();
  });
}
