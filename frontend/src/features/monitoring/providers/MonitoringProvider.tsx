import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MonitoringContext } from "@/features/monitoring/contexts/MonitoringContext";
import { useSettings } from "@/shared/preferences/useSettings";
import { useLocation } from "react-router-dom";
import type { MonitoringSnapshot } from "@/features/monitoring/types";
import type { Period } from "@/shared/lib/period";
import { mergeCollectionHistory, summarizeCollections } from "@/features/monitoring/domain/history";
import { isPeriod } from "@/shared/lib/period";
import { DiscoveryError } from "@/features/monitoring/api/discoveryError";
import { isCollectionStale, STALE_METRICS_MESSAGE } from "@/features/monitoring/domain/freshness";

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [selectedPeriod, setPeriod] = useState<Period>(settings.defaultPeriod);
  const [liveSnapshot, setLiveSnapshot] = useState<MonitoringSnapshot>({
    regions: [],
    services: [],
    history: [],
    totalEnergyKwh: null,
    totalEmissionsG: null,
    lastCollectionAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const { pathname, search } = useLocation();
  const queryPeriod = new URLSearchParams(search).get("periodo");
  const period = isPeriod(queryPeriod) ? queryPeriod : selectedPeriod;
  const monitoringActive = ["/pesquisa", "/dashboard"].includes(pathname);

  const refresh = useCallback(async () => {
    if (pending.current) return null;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError(null);
    try {
      const { getMonitoringSnapshot } = await import("@/features/monitoring/api/monitoring");
      const next = await getMonitoringSnapshot(controller.signal);
      if (controller.signal.aborted) return null;
      setLiveSnapshot((previous) => {
        const previousServices = new Map(
          previous.services.map((service) => [service.id, service]),
        );
        const currentIds = new Set(next.services.map((service) => service.id));
        const lastCollectionAt =
          next.lastCollectionAt &&
          (!previous.lastCollectionAt ||
            Date.parse(next.lastCollectionAt) > Date.parse(previous.lastCollectionAt))
            ? next.lastCollectionAt
            : previous.lastCollectionAt;
        return {
          ...next,
          lastCollectionAt,
          services: [
            ...next.services.map((service) => ({
              ...service,
              lastCollectionAt:
                service.lastCollectionAt ??
                previousServices.get(service.id)?.lastCollectionAt ??
                null,
            })),
            ...previous.services
              .filter((service) => !currentIds.has(service.id))
              .map((service) =>
                next.discoveryComplete === false
                  ? service
                  : {
                      ...service,
                      status: "removed" as const,
                      cpuPercent: null,
                      memoryGb: null,
                      diskGb: null,
                      networkGb: null,
                      energyKwh: null,
                      emissionsG: null,
                      collectionIntervalSeconds: null,
                      carbonIntensity: null,
                      renewablePercent: null,
                      statusMessage: "Serviço ausente do registro atual.",
                    },
              ),
          ],
          // Totais de estimativas por amostra.
          history: mergeCollectionHistory(
            previous.history,
            next.history,
            Date.parse(lastCollectionAt ?? next.discoveryUpdatedAt!) - 30 * 86400_000,
          ),
        };
      });
      return next;
    } catch (cause) {
      if (!controller.signal.aborted) {
        const discovery = cause instanceof DiscoveryError ? cause : null;
        setLiveSnapshot((previous) => ({
          ...previous,
          regions: discovery?.regions ?? previous.regions,
          warning: discovery ? discovery.catalogWarning : previous.warning,
          services: previous.services.map((service) =>
            service.status === "available" && service.lastCollectionAt &&
            isCollectionStale(service.lastCollectionAt, service.collectionIntervalSeconds ?? 0)
              ? {
                  ...service,
                  status: "stale" as const,
                  statusMessage: [STALE_METRICS_MESSAGE, service.statusMessage].filter(Boolean).join(" "),
                }
              : service,
          ),
        }));
        setError(
          "Não foi possível consultar o agregador pelo backend. Os últimos dados recebidos foram preservados. Verifique a conexão e tente atualizar novamente. " +
            (cause instanceof Error ? cause.message : ""),
        );
      }
      return null;
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!pending.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!monitoringActive) return;
    const updateIfVisible = () => {
      if (!document.hidden) void refresh();
    };
    const initial = window.setTimeout(updateIfVisible, 0);
    const timer = window.setInterval(updateIfVisible, 30_000);
    document.addEventListener("visibilitychange", updateIfVisible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateIfVisible);
      pending.current?.abort();
      pending.current = null;
    };
  }, [monitoringActive, refresh]);

  const totals = useMemo(
    () => summarizeCollections(liveSnapshot.history),
    [liveSnapshot.history],
  );
  const snapshot = useMemo(() => {
    const history = liveSnapshot.history;
    return {
      ...liveSnapshot,
      history,
      totalEnergyKwh: totals.energyKwh,
      totalEmissionsG: totals.emissionsG,
    };
  }, [liveSnapshot, totals]);

  const monitoring = useMemo(
    () => ({ snapshot, period, setPeriod, refresh, loading, error }),
    [snapshot, period, refresh, loading, error],
  );

  return (
    <MonitoringContext.Provider value={monitoring}>
      {children}
    </MonitoringContext.Provider>
  );
}
