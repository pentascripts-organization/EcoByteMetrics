import type { LucideIcon } from "lucide-react";

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
