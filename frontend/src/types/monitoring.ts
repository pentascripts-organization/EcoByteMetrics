export type ServiceStatus = 'available' | 'unavailable' | 'no-metrics' | 'removed';
export type Period = '24h' | '7d' | '30d';

export interface MonitoredService {
  id: string;
  name: string;
  status: ServiceStatus;
  country: string | null;
  region: string | null;
  city: string | null;
  cpuPercent: number | null;
  memoryGb: number | null;
  diskGb: number | null;
  networkGb: number | null;
  energyKwh: number | null;
  emissionsG: number | null;
}

export interface CollectionPoint {
  collectedAt: string;
  energyKwh: number;
  emissionsG: number;
}

export interface MonitoringSnapshot {
  services: MonitoredService[];
  history: CollectionPoint[];
  totalEnergyKwh: number | null;
  totalEmissionsG: number | null;
  lastCollectionAt: string | null;
}

export interface MonitoringSettings {
  parallaxEnabled: boolean;
  defaultPeriod: Period;
}
