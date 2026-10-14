import { useEffect, useState } from "react";

export function useCarousel(length: number, intervalMs = 6000) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (length <= 1 || paused || reducedMotion) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [length, intervalMs, paused, reducedMotion]);

  return { index, paused, setPaused };
}
