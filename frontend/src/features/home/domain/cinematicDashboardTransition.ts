import { waitForGlobePaint } from "./waitForGlobePaint";

function captureHome() {
  const home = document.querySelector<HTMLElement>(".ecobyte-home");
  if (!home) return null;
  const copy = home.cloneNode(true) as HTMLElement;
  const videos = [...home.querySelectorAll("video")];
  copy.querySelectorAll("video").forEach((video, index) => {
    const original = videos[index]!;
    const frame = document.createElement("canvas");
    frame.width = original.videoWidth || 1280;
    frame.height = original.videoHeight || 720;
    frame.style.cssText = "width:100%;height:100%;object-fit:cover;object-position:var(--hero-position)";
    try {
      if (original.readyState < 2) throw new Error("Frame unavailable");
      frame.getContext("2d")!.drawImage(original, 0, 0, frame.width, frame.height);
      video.replaceWith(frame);
    } catch {
      const poster = document.createElement("img");
      poster.src = original.poster;
      poster.alt = "";
      poster.style.cssText = frame.style.cssText;
      video.replaceWith(poster);
    }
  });
  for (const element of [copy, ...copy.querySelectorAll<HTMLElement>("*")]) {
    element.removeAttribute("id");
    element.removeAttribute("aria-live");
    element.style.animation = "none";
    element.style.transition = "none";
  }
  copy.style.width = `${document.documentElement.clientWidth}px`;
  copy.style.position = "relative";
  copy.style.top = `${-window.scrollY}px`;
  const layer = document.createElement("div");
  layer.className = "home-departure-frame";
  layer.inert = true;
  layer.setAttribute("aria-hidden", "true");
  layer.append(copy);
  document.body.append(layer);
  return layer;
}

export async function cinematicDashboardTransition(navigate: (entry: "crossfade" | "fade") => void) {
  let frame: HTMLDivElement | null;
  try { frame = captureHome(); } catch { navigate("fade"); return; }
  if (!frame) { navigate("fade"); return; }
  const controller = new AbortController();
  const animations: Animation[] = [];
  const destinationState: {shell: HTMLElement | null; inert: boolean} = {shell:null, inert:false};
  let navigated = false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cancel = () => controller.abort();
  const watch = () => {
    if (window.location.pathname !== "/dashboard") { cancel(); return; }
    const next = document.querySelector<HTMLElement>(".monitoring-shell");
    if (next && destinationState.shell !== next) {
      destinationState.shell = next;
      destinationState.inert = next.inert;
      next.inert = true;
    }
  };
  const observer = new MutationObserver(watch);
  const page = document.documentElement;
  try {
    page.dataset.homeCinema = "waiting";
    navigate("crossfade");
    navigated = true;
    watch();
    observer.observe(document.getElementById("root") ?? document.body, {childList:true,subtree:true});
    window.addEventListener("popstate", cancel);
    window.addEventListener("pagehide", cancel);
    reduced.addEventListener("change", cancel);
    const painted = await waitForGlobePaint(
      () => Boolean(document.querySelector('.globe-stage[data-painted="true"]')),
      callback => {
        const paintObserver = new MutationObserver(callback);
        paintObserver.observe(document.getElementById("root") ?? document.body, {attributes:true,attributeFilter:["data-painted"],childList:true,subtree:true});
        return () => paintObserver.disconnect();
      }, controller.signal,
    );
    if (controller.signal.aborted) return;
    page.dataset.homeCinema = painted ? "globe" : "fallback";
    const duration = painted ? 850 : 600;
    const leaving = frame.animate([
      {transform:"translateX(0) scale(1)"},
      {transform:`translateX(-100%) scale(${painted ? ".98" : "1"})`},
    ], {duration:painted ? 300 : 600,easing:"cubic-bezier(.22,1,.36,1)",fill:"forwards"});
    animations.push(leaving);
    // Keep only a timing clock after the source leaves; the destination globe stays live.
    const clock = frame.animate([{opacity:1},{opacity:1}], {duration});
    animations.push(clock);
    const abortAnimations = () => { for (const animation of animations) animation.cancel(); };
    controller.signal.addEventListener("abort", abortAnimations, {once:true});
    await clock.finished.catch(() => {});
    controller.signal.removeEventListener("abort", abortAnimations);
  } catch {
    if (!navigated) navigate("fade");
  } finally {
    observer.disconnect();
    controller.abort();
    window.removeEventListener("popstate", cancel);
    window.removeEventListener("pagehide", cancel);
    reduced.removeEventListener("change", cancel);
    for (const animation of animations) animation.cancel();
    frame.remove();
    delete page.dataset.homeCinema;
    const destination = document.querySelector<HTMLElement>(".monitoring-shell");
    if (destination && destination === destinationState.shell) destination.inert = destinationState.inert;
    if (window.location.pathname === "/dashboard") document.querySelector<HTMLElement>(".monitoring-shell main h1")?.focus({preventScroll:true});
  }
}
