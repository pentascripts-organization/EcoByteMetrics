import { useLayoutEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";

export function MonitoringTabs({ label, tabs, value, onChange, panelId = "monitoring-content", slidingIndicator = false, className = "monitoring-tabs" }: {
  label: string;
  tabs: { value: string; label: string; mobileLabel?: string; className?: string; restricted?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  panelId?: string;
  slidingIndicator?: boolean;
  className?: string;
}) {
  const [highlight, setHighlight] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  if (previousValue !== value) { setPreviousValue(value); setHighlight(value); }
  const root = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const list = root.current, line = indicator.current;
    if (!slidingIndicator || !list || !line) return;
    let frame = 0;
    const measure = () => {
      const selected = list.querySelector<HTMLButtonElement>('[role="tab"][data-highlighted="true"]');
      if (!selected || !selected.offsetWidth) return;
      line.style.transform = `translate(${selected.offsetLeft}px, ${selected.offsetTop + selected.offsetHeight - 2}px)`;
      line.style.width = `${selected.offsetWidth}px`;
      line.style.visibility = "visible";
      if (list.classList.contains("monitoring-primary-tabs") && list.scrollWidth > list.clientWidth) {
        const left = selected.offsetLeft;
        const right = left + selected.offsetWidth;
        if (left < list.scrollLeft) list.scrollLeft = left;
        else if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
      }
      // Place the first underline immediately; later targets use the same CSS transition.
      if (!line.dataset.ready) frame = requestAnimationFrame(() => { line.dataset.ready = "true"; });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.querySelectorAll('[role="tab"]').forEach(button => observer.observe(button));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [slidingIndicator, highlight]);
  return <div ref={root} data-sliding-indicator={slidingIndicator || undefined} className={className} role="tablist" aria-label={label}
    onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(button => button.getClientRects().length);
      if (!buttons.length) return;
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[next]?.click();
      buttons[next]?.focus();
    }}>
    {slidingIndicator && <span ref={indicator} className="monitoring-tab-indicator" aria-hidden="true" />}
    {tabs.map(tab => <button key={tab.value} type="button" role="tab" className={tab.className}
      data-highlighted={highlight === tab.value} aria-selected={value === tab.value} tabIndex={value === tab.value ? 0 : -1}
      aria-controls={panelId} title={tab.restricted ? "Área restrita: acesso com uma conta" : undefined} onClick={() => { if (slidingIndicator) setHighlight(tab.value); onChange(tab.value); }}>{tab.mobileLabel ? <><span className="tab-desktop-label">{tab.label}</span><span className="tab-mobile-label">{tab.mobileLabel}</span></> : tab.label}{tab.restricted && <><LockKeyhole size={14} aria-hidden="true" /><span className="sr-only"> — acesso com conta</span></>}</button>)}
  </div>;
}
