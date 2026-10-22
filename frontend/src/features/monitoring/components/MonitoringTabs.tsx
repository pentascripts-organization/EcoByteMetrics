export function MonitoringTabs({ label, tabs, value, onChange }: {
  label: string;
  tabs: { value: string; label: string; mobileLabel?: string; className?: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="monitoring-tabs" role="tablist" aria-label={label}
    onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')].filter(button => button.getClientRects().length);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[next]?.click();
      buttons[next]?.focus();
    }}>
    {tabs.map(tab => <button key={tab.value} type="button" role="tab" className={tab.className}
      aria-selected={value === tab.value} tabIndex={value === tab.value ? 0 : -1}
      aria-controls="monitoring-content" onClick={() => onChange(tab.value)}>{tab.mobileLabel ? <><span className="tab-desktop-label">{tab.label}</span><span className="tab-mobile-label">{tab.mobileLabel}</span></> : tab.label}</button>)}
  </div>;
}
