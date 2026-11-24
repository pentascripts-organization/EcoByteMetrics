import type { ServiceStatus } from "../types.ts";

export type ImpactTone = "green" | "yellow" | "red" | "muted";

export function impactTone(status: ServiceStatus): ImpactTone {
  if (status === "unavailable") return "red";
  if (status === "no-metrics" || status === "stale") return "yellow";
  if (status === "removed") return "muted";
  return "green";
}
