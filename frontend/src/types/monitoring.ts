export type ServiceStatus = 'available' | 'unavailable' | 'no-metrics' | 'removed';
export type Period = '24h' | '7d' | '30d';

export interface CarbonRegion {
  code: string;
  country: string;
  region: string;
  city: string | null;
  latitude: number;
  longitude: number;
  carbonIntensity: number;
  renewablePercent: number;
}

export interface MonitoredService {
  id: string;
  name: string;
  status: ServiceStatus;
  country: string | null;
  region: string | null;
  regionCode?: string;
  city: string | null;
  cpuPercent: number | null;
  memoryGb: number | null;
  diskGb: number | null;
  networkGb: number | null;
  energyKwh: number | null;
  emissionsG: number | null;
  latitude?: number;
  longitude?: number;
  renewablePercent?: number | null;
  carbonIntensity?: number | null;
  collectionIntervalSeconds?: number | null;
  statusMessage?: string;
}

export interface CollectionPoint {
  serviceId?: string;
  regionCode?: string;
  country?: string | null;
  city?: string | null;
  collectedAt: string;
  energyKwh: number;
  emissionsG: number | null;
}

export interface MonitoringSnapshot {
  regions: CarbonRegion[];
  services: MonitoredService[];
  history: CollectionPoint[];
  totalEnergyKwh: number | null;
  totalEmissionsG: number | null;
  lastCollectionAt: string | null;
  warning?: string;
}

export interface MonitoringSettings {
  parallaxEnabled: boolean;
  defaultPeriod: Period;
}
