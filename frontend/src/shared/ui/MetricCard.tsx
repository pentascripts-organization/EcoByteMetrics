import type { LucideIcon } from "lucide-react";
import { IconTile } from "./IconTile";

export function MetricCard({
  label,
  value,
  unit,
  icon,
  note,
  tone = "green",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  note: string;
  tone?: "green" | "blue" | "amber";
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <IconTile icon={icon} tone={tone} />
      </div>
      <div className="metric-value">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      <div className="metric-note">
        <span className="neutral-dot" />
        {note}
      </div>
    </article>
  );
}
