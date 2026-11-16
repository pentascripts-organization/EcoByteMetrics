import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SpecularButton from "@/shared/ui/SpecularButton";
import { Minimize2 } from "lucide-react";

export function ExpandedGlobe({ onClose }: { onClose: () => void }) {
  const closeButton = useRef<HTMLDivElement>(null);
  const shell = document.querySelector<HTMLElement>(".monitoring-shell");
  useEffect(() => {
    if (!shell) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    const panels = [...shell.querySelectorAll<HTMLElement>(".monitoring-header, .monitoring-heading, .monitoring-main > .monitoring-tabs, .monitoring-summary, .monitoring-applications, .monitoring-notice, .monitoring-past-banner, .globe-expand-button")];
    const previousInert = panels.map(panel => panel.inert);
    for (const panel of panels) panel.inert = true;
    document.body.style.overflow = "hidden";
    shell.classList.add("is-globe-expanded");
    closeButton.current?.querySelector("button")?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", escape);
    return () => {
      shell.classList.remove("is-globe-expanded");
      document.body.style.overflow = overflow;
      panels.forEach((panel, index) => { panel.inert = previousInert[index]!; });
      document.removeEventListener("keydown", escape);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [shell, onClose]);
  return shell ? createPortal(<div ref={closeButton} className="globe-exploration-controls">
    <SpecularButton size="lg" radius={26} tint="#ffffff" tintOpacity={0.04} textColor="#10b981" lineColor="#10b981" baseColor="#10b981" intensity={0.55} idleIntensity={0} shineSize={10} shineFade={90} thickness={1.2} glow={2} followMouse proximity={50} className="monitoring-filter-button" onClick={onClose}><Minimize2 size={18} aria-hidden="true" />Voltar ao painel <kbd>Esc</kbd></SpecularButton>
  </div>, shell) : null;
}
