import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MonitoringContext } from "../contexts/MonitoringContext";
import { SettingsContext } from "../contexts/SettingsContext";
import { useLocation } from "react-router-dom";
import type {
  MonitoringSettings,
  MonitoringSnapshot,
  Period,
} from "../types/monitoring";
import { mergeCollectionHistory, summarizeCollections } from "../utils/history";
import { isPeriod } from "../types/monitoring";
import { DiscoveryError } from "../services/discoveryError";

const SETTINGS_KEY = "ecobytemetrics.preferences.v1";
const DEFAULT_SETTINGS: MonitoringSettings = {
  parallaxEnabled: true,
  defaultPeriod: "7d",
};

function readSettings(): MonitoringSettings {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ?? "null",
    );
    if (
      typeof stored === "object" &&
      stored !== null &&
      "parallaxEnabled" in stored &&
      typeof stored.parallaxEnabled === "boolean" &&
      "defaultPeriod" in stored
    ) {
      return {
        parallaxEnabled: stored.parallaxEnabled,
        defaultPeriod: isPeriod(stored.defaultPeriod)
          ? stored.defaultPeriod
          : DEFAULT_SETTINGS.defaultPeriod,
      };
    }
  } catch {
    /* Armazenamento indisponível ou preferências inválidas. */
  }
  return DEFAULT_SETTINGS;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [settings] = useState(readSettings);
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
      const { getMonitoringSnapshot } = await import("../services/monitoring");
      const next = await getMonitoringSnapshot(controller.signal);
      if (controller.signal.aborted) return null;
      setLiveSnapshot((previous) => {
        const previousServices = new Map(
          previous.services.map((service) => [service.id, service]),
        );
        const currentIds = new Set(next.services.map((service) => service.id));
        return {
          ...next,
          lastCollectionAt:
            next.lastCollectionAt &&
            (!previous.lastCollectionAt ||
              Date.parse(next.lastCollectionAt) >
                Date.parse(previous.lastCollectionAt))
              ? next.lastCollectionAt
              : previous.lastCollectionAt,
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
          history: mergeCollectionHistory(previous.history, next.history).filter(
            (point) =>
              Date.parse(point.collectedAt) >=
              Date.parse(
                next.lastCollectionAt ??
                  previous.lastCollectionAt ??
                  next.discoveryUpdatedAt!,
              ) -
                30 * 86400_000,
          ),
        };
      });
      return next;
    } catch (cause) {
      if (!controller.signal.aborted && cause instanceof DiscoveryError) {
        setLiveSnapshot((previous) => ({
          ...previous,
          regions: cause.regions ?? previous.regions,
          warning: cause.catalogWarning,
        }));
      }
      if (!controller.signal.aborted)
        setError(
          "Não foi possível consultar o agregador pelo backend. Os últimos dados recebidos foram preservados. Verifique a conexão e tente atualizar novamente. " +
            (cause instanceof Error ? cause.message : ""),
        );
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

  const snapshot = useMemo(() => {
    const history = liveSnapshot.history;
    const totals = summarizeCollections(history);
    return {
      ...liveSnapshot,
      history,
      totalEnergyKwh: totals.energyKwh,
      totalEmissionsG: totals.emissionsG,
    };
  }, [liveSnapshot]);

  const preferences = useMemo(
    () => ({ settings }),
    [settings],
  );
  const monitoring = useMemo(
    () => ({ snapshot, period, setPeriod, refresh, loading, error }),
    [snapshot, period, refresh, loading, error],
  );

  return (
    <SettingsContext.Provider value={preferences}>
      <MonitoringContext.Provider value={monitoring}>
        {children}
      </MonitoringContext.Provider>
    </SettingsContext.Provider>
  );
}
