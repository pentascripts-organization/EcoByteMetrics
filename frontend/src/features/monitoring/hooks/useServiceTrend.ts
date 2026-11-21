import { useEffect, useMemo, useState } from "react";
import type { CollectionPoint, MonitoredService } from "../types";
import type { DashboardMetric } from "../domain/dashboard";
import type { Period } from "@/shared/lib/period";
import { calculateTrend, type ServiceTrend } from "../domain/trend";
import { getMonitoringSnapshot } from "../api/monitoring";

const trendHistoryCache = new Map<string, { points: CollectionPoint[]; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minuto de cache em memória

export function useServiceTrend({
  service,
  metric,
  period = "24h",
  until,
  preloadedHistory = [],
  isExpanded = false,
}: {
  service: MonitoredService;
  metric: DashboardMetric;
  period?: Period;
  until?: string;
  preloadedHistory?: CollectionPoint[];
  isExpanded?: boolean;
}): { trend: ServiceTrend; loading: boolean; error: boolean } {
  const serviceId = service.id;
  const cacheKey = JSON.stringify([serviceId, period, until ?? null]);

  // Filtra histórico pré-carregado que já pertença a este serviço
  const preloadedServicePoints = useMemo(
    () => preloadedHistory.filter((p) => p.serviceId === serviceId && (!until || Date.parse(p.collectedAt) <= Date.parse(until))),
    [preloadedHistory, serviceId, until],
  );

  const enabled = isExpanded && preloadedServicePoints.length < 2;
  const [result, setResult] = useState<{key: string; points: CollectionPoint[]; loading: boolean; error: boolean}>(
    {key: "", points: [], loading: false, error: false},
  );
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const cached = trendHistoryCache.get(cacheKey);
      const remaining = cached ? CACHE_TTL_MS - (Date.now() - cached.timestamp) : 0;
      if (cached && remaining > 0) {
        setResult({key: cacheKey, points: cached.points, loading: false, error: false});
        timer = setTimeout(() => void load(), remaining);
        return;
      }
      controller = new AbortController();
      setResult(previous => ({key: cacheKey, points: previous.key === cacheKey ? previous.points : [], loading: true, error: false}));
      try {
        const snapshot = await getMonitoringSnapshot(controller.signal, {period, until, serviceIds: [serviceId], includeHistory: true});
        if (disposed) return;
        const points = snapshot.history.filter(point => point.serviceId === serviceId && (!until || Date.parse(point.collectedAt) <= Date.parse(until)));
        trendHistoryCache.set(cacheKey, {points, timestamp: Date.now()});
        setResult({key: cacheKey, points, loading: false, error: false});
      } catch {
        if (disposed) return;
        setResult(previous => ({key: cacheKey, points: previous.key === cacheKey ? previous.points : [], loading: false, error: true}));
      }
      if (!disposed) timer = setTimeout(() => void load(), CACHE_TTL_MS);
    };
    timer = setTimeout(() => void load(), 0);
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); };
  }, [enabled, cacheKey, period, until, serviceId]);

  const cached = trendHistoryCache.get(cacheKey);
  const effectivePoints = preloadedServicePoints.length >= 2 ? preloadedServicePoints
    : result.key === cacheKey ? result.points : cached?.points ?? preloadedServicePoints;
  const loading = enabled && (result.key === cacheKey ? result.loading : !cached);
  const error = enabled && result.key === cacheKey && result.error;

  const fallbackValue = metric === "energy" ? service.energyKwh : service.emissionsG;

  const trend = useMemo(
    () => calculateTrend(effectivePoints, metric, period, fallbackValue),
    [effectivePoints, metric, period, fallbackValue],
  );

  return { trend, loading, error };
}
