import { ArrowUpRight, CircleDashed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

function analysisLink(path: string, search: string) {
  const input = new URLSearchParams(search);
  const params = new URLSearchParams();
  for (const key of ["pais", "cidade", "regiao", "periodo", "ate", "instante", "busca", "estado"]) {
    const value = input.get(key);
    if (value && (key !== "periodo" || value === "24h" || value === "7d")) params.set(key, value);
  }
  if (input.get("ordem")) params.set("ordem", input.get("ordem")!);
  if (["acumulado", "intervalos"].includes(input.get("serie") ?? "")) params.set("serie", input.get("serie")!);
  for (const id of new Set(input.getAll("app"))) if (id) params.append("app", id);
  if (input.get("comparacao") === "ultima") params.set("comparacao", "ultima");
  const query = params.toString();
  return path + (query ? `?${query}` : "");
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
