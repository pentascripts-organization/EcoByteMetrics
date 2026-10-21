import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./IconTile";

export function Panel({
  title,
  eyebrow,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
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
      </div>
      {children}
    </section>
  );
}
