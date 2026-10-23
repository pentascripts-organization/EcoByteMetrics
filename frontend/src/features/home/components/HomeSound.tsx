import { useEffect } from "react";
import track from "@/shared/assets/audio/clear-air-kevin-macleod.m4a";
import { createHomeAudio } from "../domain/homeAudio";

export function HomeSound() {
  useEffect(() => {
    const player = createHomeAudio(new Audio(track));
    const start = () => {
      if (document.hidden) return;
      void player.setPlaying(true).catch(error => console.warn("Home audio unavailable", error));
    };
    const visibility = () => {
      if (document.hidden) void player.setPlaying(false);
      else start();
    };
    const interact = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest(".ecobyte-home") && event.target.closest("button, a, summary")) player.interact();
    };
    start();
    document.addEventListener("pointerdown", start);
    document.addEventListener("keydown", start);
    document.addEventListener("click", interact);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("click", interact);
      document.removeEventListener("visibilitychange", visibility);
      player.dispose();
    };
  }, []);
  return null;
}
