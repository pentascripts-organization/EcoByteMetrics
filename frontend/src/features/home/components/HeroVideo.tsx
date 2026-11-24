import { useEffect, useRef, useState } from "react";
import { bindHeroPlayback } from "../domain/heroPlayback";

type NetworkInformation = Navigator & {
  connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
};

function useReducedData() {
  const [reduced, setReduced] = useState(() => {
    if (typeof navigator === "undefined") return false;
    const connection = (navigator as NetworkInformation).connection;
    return connection?.saveData === true || /^(slow-2g|2g)$/.test(connection?.effectiveType ?? "");
  });

  useEffect(() => {
    const connection = (navigator as NetworkInformation).connection;
    if (!connection) return;
    const update = () => setReduced(connection.saveData === true || /^(slow-2g|2g)$/.test(connection.effectiveType ?? ""));
    connection.addEventListener("change", update);
    return () => connection.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function HeroVideo({ src, mobileSrc, poster, active, reducedMotion, onEnded }: {
  src: string; mobileSrc: string; poster: string; active: boolean; reducedMotion: boolean; onEnded: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reducedData = useReducedData();
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!active || reducedMotion || reducedData) { video.pause(); return; }
    return bindHeroPlayback(video, document);
  }, [active, reducedMotion, reducedData]);

  return <div className={`hero__background${active ? " active" : ""}`} aria-hidden="true">
    <video ref={ref} muted playsInline preload={active && !reducedMotion && !reducedData ? "metadata" : "none"} poster={poster} onEnded={active && !reducedMotion && !reducedData ? onEnded : undefined}
      disablePictureInPicture tabIndex={-1}>
      <source src={mobileSrc} media="(max-width: 680px)" type="video/mp4" />
      <source src={src} type="video/mp4" />
    </video>
  </div>;
}
