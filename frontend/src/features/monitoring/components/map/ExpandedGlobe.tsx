import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Minimize2 } from "lucide-react";

export function ExpandedGlobe({ onClose }: { onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
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
    closeButton.current?.focus({ preventScroll: true });
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
  return shell ? createPortal(<div className="globe-exploration-controls">
    <button ref={closeButton} type="button" onClick={onClose}><Minimize2 size={18} aria-hidden="true" />Voltar ao painel <kbd>Esc</kbd></button>
  </div>, shell) : null;
}
