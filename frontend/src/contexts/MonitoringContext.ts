import { createContext } from 'react';
import type { MonitoringSnapshot, Period, RequestRecord } from '../types/monitoring';

export interface MonitoringContextValue {
  snapshot: MonitoringSnapshot;
  period: Period;
  setPeriod: (period: Period) => void;
  refresh: () => Promise<MonitoringSnapshot | null>;
  loading: boolean;
  error: string | null;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  requests: RequestRecord[];
  clearRequests: () => void;
}

export const MonitoringContext = createContext<MonitoringContextValue | null>(null);
