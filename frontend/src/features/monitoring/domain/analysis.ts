import type { MonitoringSnapshot } from "@/features/monitoring/types";
import type { Period } from "@/shared/lib/period";
import { isPeriod } from "@/shared/lib/period";
import { matchesRegion } from "@/features/monitoring/domain/region";
import { summarizeCollections } from "@/features/monitoring/domain/history";
import { observationHistory } from "./observatory";
import { filterApplications } from "./dashboard";

export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  if (!match) return NaN;
  const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = match
    .slice(1)
    .map((part) => Number(part ?? 0));
  const date = new Date(value);
  return date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second
    ? date.getTime()
    : NaN;
}

export function analysisQuery(search: string) {
  const input = new URLSearchParams(search);
  const result = new URLSearchParams();
  for (const key of ["pais", "cidade", "regiao", "periodo", "ate", "instante", "busca", "estado"]) {
    const value = input.get(key);
    if (value && (key !== "periodo" || isPeriod(value))) result.set(key, value);
  }
  return result;
}

export function analysisLink(path: string, search: string) {
  const params = analysisQuery(search);
  const input = new URLSearchParams(search);
  if (input.get("ordem")) params.set("ordem", input.get("ordem")!);
  if (input.get("serie") === "acumulado") params.set("serie", "acumulado");
  for (const id of new Set(input.getAll("app"))) if (id) params.append("app", id);
  const query = params.toString();
  return path + (query ? "?" + query : "");
}

export function getAnalysis(
  snapshot: MonitoringSnapshot,
  period: Period,
  search: string,
) {
  const params = new URLSearchParams(search);
  const observedAt = params.get("instante") ?? "";
  const observations = snapshot.observations ?? [];
  const observation = observations.find(entry => entry.observedAt === observedAt);
  const observationMissing = Boolean(observedAt && !observation);
  const environmentServices = observation?.services ?? (observationMissing ? [] : snapshot.services);
  const sourceHistory = observation ? observationHistory(observations, observedAt) : observationMissing ? [] : snapshot.history;
  const regionCode = params.get("regiao") ?? "";
  const selectedRegion = snapshot.regions.find(
    (region) => region.code === regionCode,
  );
  const country = selectedRegion?.country ?? params.get("pais") ?? "";
  const city = selectedRegion?.city ?? params.get("cidade") ?? "";
  const date = params.get("ate") ?? "";
  const regional = Boolean(regionCode || country || city);
  const regionalServices = environmentServices.filter((service) =>
    regionCode
      ? service.regionCode === regionCode
      : matchesRegion(service, country, city),
  );
  const services = filterApplications(regionalServices, params.get("busca") ?? "", params.get("estado") ?? "");
  const end = date
    ? parseLocalDate(date)
    : Date.parse(observation?.observedAt ?? snapshot.lastCollectionAt ?? "");
  const invalidDate = Boolean(date && !Number.isFinite(end));
  const serviceIds = new Set(services.map((service) => service.id));
  const days = period === "24h" ? 1 : 7;
  const start = end - days * 86400_000;
  const recordedHistory = sourceHistory.filter((point) => {
    if (!serviceIds.has(point.serviceId)) return false;
    if (!regional) return true;
    if (regionCode)
      return point.regionCode
        ? point.regionCode === regionCode
        : serviceIds.has(point.serviceId);
    return point.country
      ? matchesRegion(
          { country: point.country, city: point.city ?? null },
          country,
          city,
        )
      : serviceIds.has(point.serviceId);
  });
  const history = recordedHistory.filter((point) => {
    const timestamp = Date.parse(point.collectedAt);
    return (
      !invalidDate &&
      Number.isFinite(end) &&
      timestamp > start &&
      timestamp <= end
    );
  });
  const availableSince = recordedHistory.reduce<number | null>(
    (first, point) => {
      const timestamp = Date.parse(point.collectedAt);
      return Number.isFinite(timestamp) &&
        timestamp <= end &&
        (first === null || timestamp < first)
        ? timestamp
        : first;
    },
    null,
  );
  const periodLabel = period === "24h" ? "Últimas 24 horas" : "Últimos 7 dias";
  const monitoredRegions = new Set(
    services
      .filter((service) => service.status !== "removed")
      .map((service) => service.regionCode),
  );
  const regions = snapshot.regions.filter((region) =>
    regionCode
      ? region.code === regionCode
      : regional
        ? matchesRegion(region, country, city)
        : monitoredRegions.has(region.code),
  );
  return {
    observedAt,
    observationMissing,
    environmentServices,
    warning: observation ? observation.warning : observationMissing ? undefined : snapshot.warning,
    services,
    history,
    collectionEvents: observationMissing ? [] : (snapshot.collectionEvents ?? []).filter(event =>
      (!event.serviceIds || event.serviceIds.some(id => serviceIds.has(id))) &&
      (!observedAt || Date.parse(event.to) <= Date.parse(observedAt))),
    regions,
    country,
    city,
    regionCode,
    date,
    regional,
    invalidDate,
    periodLabel,
    windowStart: Number.isFinite(start) && !invalidDate ? start : null,
    windowEnd: Number.isFinite(end) && !invalidDate ? end : null,
    availableSince,
    shortHistory: availableSince !== null && availableSince > start,
    selection:
      [country, city].filter(Boolean).join(" — ") ||
      (regionCode ? "Região " + regionCode : ""),
    totals: summarizeCollections(history),
  };
}
