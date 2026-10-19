import {
  ArrowUpRight,
  CalendarDays,
  CircleDashed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useMonitoring } from "../hooks/useMonitoring";
import { analysisLink, isPeriod } from "../utils/analysis";

export function IconTile({
  icon: Icon,
  tone = "green",
}: {
  icon: LucideIcon;
  tone?: "green" | "blue" | "amber";
}) {
  return (
    <span className={`icon-tile icon-tile-${tone}`}>
      <Icon size={21} strokeWidth={1.65} />
    </span>
  );
}

export function EmptyState({
  icon: Icon = CircleDashed,
  title,
  description,
  compact = false,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={`empty-state${compact ? " empty-state-compact" : ""}`}>
      <span className="empty-state-icon">
        <Icon size={28} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  icon: Icon,
  link,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  link?: { to: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  const { search } = useLocation();
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div className="panel-title-group">
          {Icon && <IconTile icon={Icon} />}
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
        </div>
        {link && (
          <Link className="text-link" to={analysisLink(link.to, search)}>
            {link.label}
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PeriodSelect() {
  const { period, setPeriod, refresh } = useMonitoring();
  const [, setParams] = useSearchParams();
  return (
    <label className="period-select">
      <CalendarDays size={17} />
      <span className="sr-only">Período de análise</span>
      <select
        value={period}
        onChange={(event) => {
          const next = new URLSearchParams(window.location.search);
          const value = event.target.value;
          if (!isPeriod(value)) return;
          next.set("periodo", value);
          setPeriod(value);
          setParams(next, { replace: true });
          if (value !== period) void refresh();
        }}
      >
        <option value="24h">Últimas 24 horas</option>
        <option value="7d">Últimos 7 dias</option>
      </select>
    </label>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">
        <PeriodSelect />
      </div>
    </div>
  );
}

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
