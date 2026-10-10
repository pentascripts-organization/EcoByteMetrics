import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MonitoringContext } from '../contexts/MonitoringContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { useLocation } from 'react-router-dom';
import { getDemoSnapshot } from '../services/demo';
import type { MonitoringSettings, MonitoringSnapshot, Period } from '../types/monitoring';

const SETTINGS_KEY = 'ecobytemetrics.preferences.v1';
const DEFAULT_SETTINGS: MonitoringSettings = { parallaxEnabled: true, defaultPeriod: '7d' };

function readSettings(): MonitoringSettings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (typeof stored === 'object' && stored !== null && 'parallaxEnabled' in stored &&
        typeof stored.parallaxEnabled === 'boolean' && 'defaultPeriod' in stored &&
        (stored.defaultPeriod === '24h' || stored.defaultPeriod === '7d' || stored.defaultPeriod === '30d')) {
      return { parallaxEnabled: stored.parallaxEnabled, defaultPeriod: stored.defaultPeriod };
    }
  } catch { /* Unavailable storage or obsolete preferences: use safe defaults. */ }
  return DEFAULT_SETTINGS;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(readSettings);
  const [period, setPeriod] = useState<Period>(settings.defaultPeriod);
  const [liveSnapshot, setLiveSnapshot] = useState<MonitoringSnapshot>({
    regions: [], services: [], history: [], totalEnergyKwh: null, totalEmissionsG: null, lastCollectionAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const { pathname } = useLocation();
  const monitoringActive = !['/', '/login', '/cadastro'].includes(pathname);

  const refresh = useCallback(async () => {
    if (demoMode) return getDemoSnapshot(period);
    if (pending.current) return null;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError(null);
    try {
      const { getMonitoringSnapshot } = await import('../services/monitoring');
      const next = await getMonitoringSnapshot(controller.signal);
      if (controller.signal.aborted) return null;
      setLiveSnapshot((previous) => ({ ...next,
        services: [...next.services, ...previous.services.filter((service) => !next.services.some((current) => current.id === service.id)).map((service) => ({ ...service, status: 'removed' as const, cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null, statusMessage: 'Serviço ausente do registro atual.' }))],
        // shortcut: collection intervals may overlap; deduplicate before reporting continuous consumption.
        history: [...previous.history, ...next.history].filter((point) => Date.parse(point.collectedAt) >= Date.parse(next.lastCollectionAt!) - 30 * 86400_000),
      }));
      return next;
    } catch {
      if (!controller.signal.aborted) setError('Não foi possível consultar o agregador. Os últimos dados recebidos foram preservados. Tente atualizar novamente.');
      return null;
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [demoMode, period]);

  useEffect(() => {
    if (!monitoringActive || demoMode) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); pending.current?.abort(); pending.current = null; };
  }, [monitoringActive, demoMode, refresh]);

  const snapshot = useMemo(() => {
    if (demoMode) return getDemoSnapshot(period);
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const history = liveSnapshot.history.filter((point) => Date.parse(point.collectedAt) >= Date.parse(liveSnapshot.lastCollectionAt ?? '') - days * 86400_000);
    return { ...liveSnapshot, history, totalEnergyKwh: history.length ? history.reduce((sum, point) => sum + point.energyKwh, 0) : null, totalEmissionsG: history.some((point) => point.emissionsG !== null) ? history.reduce((sum, point) => sum + (point.emissionsG ?? 0), 0) : null };
  }, [liveSnapshot, demoMode, period]);

  const saveSettings = useCallback((next: MonitoringSettings) => {
    setSettings(next);
    setPeriod(next.defaultPeriod);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); return true; }
    catch { return false; }
  }, []);

  const preferences = useMemo(() => ({ settings, saveSettings }), [settings, saveSettings]);
  const monitoring = useMemo(() => ({ snapshot, period, setPeriod, refresh, loading: !demoMode && loading, error: demoMode ? null : error, demoMode, setDemoMode }),
    [snapshot, period, refresh, loading, error, demoMode]);

  return <SettingsContext.Provider value={preferences}>
    <MonitoringContext.Provider value={monitoring}>{children}</MonitoringContext.Provider>
  </SettingsContext.Provider>;
}
