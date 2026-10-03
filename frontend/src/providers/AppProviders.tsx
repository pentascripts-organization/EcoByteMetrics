import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MonitoringContext } from '../contexts/MonitoringContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { getMonitoringSnapshot } from '../services/monitoring';
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
  const [snapshot, setSnapshot] = useState<MonitoringSnapshot>({
    services: [], history: [], totalEnergyKwh: null, totalEmissionsG: null, lastCollectionAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setSnapshot(await getMonitoringSnapshot(period)); }
    catch { setError('Não foi possível carregar os indicadores. Tente novamente.'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    getMonitoringSnapshot(period).then((next) => {
      if (!cancelled) { setSnapshot(next); setError(null); setLoading(false); }
    }).catch(() => {
      if (!cancelled) { setError('Não foi possível carregar os indicadores. Tente novamente.'); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [period]);

  const saveSettings = useCallback((next: MonitoringSettings) => {
    setSettings(next);
    setPeriod(next.defaultPeriod);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); return true; }
    catch { return false; }
  }, []);

  const preferences = useMemo(() => ({ settings, saveSettings }), [settings, saveSettings]);
  const monitoring = useMemo(() => ({ snapshot, period, setPeriod, refresh, loading, error }),
    [snapshot, period, refresh, loading, error]);

  return <SettingsContext.Provider value={preferences}>
    <MonitoringContext.Provider value={monitoring}>{children}</MonitoringContext.Provider>
  </SettingsContext.Provider>;
}
