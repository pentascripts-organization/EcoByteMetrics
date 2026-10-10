import type { CarbonRegion, MonitoringSnapshot, MonitoredService, Period } from '../types/monitoring';

// Fixed examples for the prototype; never presented as API measurements.
const services: MonitoredService[] = [
  { id: 'demo-br', name: 'Aplicação Brasil', status: 'available', country: 'Brasil', region: 'Sudeste', city: 'São Paulo', latitude: -23.55, longitude: -46.63, cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1, energyKwh: 0.0008478333, emissionsG: 0.07206583, renewablePercent: 85 },
  { id: 'demo-fr', name: 'Aplicação França', status: 'unavailable', country: 'França', region: 'Île-de-France', city: 'Paris', latitude: 48.86, longitude: 2.35, cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null, renewablePercent: null },
  { id: 'demo-jp', name: 'Aplicação Japão', status: 'no-metrics', country: 'Japão', region: 'Kantō', city: 'Tóquio', latitude: 35.68, longitude: 139.69, cpuPercent: 20, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null, renewablePercent: null },
];

export function getDemoSnapshot(period: Period): MonitoringSnapshot {
  const regions: CarbonRegion[] = services.map((service) => ({ code: service.id, country: service.country!, region: service.region!, city: service.city, latitude: service.latitude!, longitude: service.longitude!, carbonIntensity: 85, renewablePercent: service.renewablePercent ?? 0 }));
  const history = [
    { serviceId: 'demo-br', collectedAt: '2026-10-08T12:00:00-03:00', energyKwh: 0.00061, emissionsG: 0.05185 },
    { serviceId: 'demo-br', collectedAt: '2026-10-09T12:00:00-03:00', energyKwh: 0.00072, emissionsG: 0.0612 },
    { serviceId: 'demo-br', collectedAt: '2026-10-10T12:00:00-03:00', energyKwh: 0.0008478333, emissionsG: 0.07206583 },
  ].filter((point) => period !== '24h' || point.collectedAt.startsWith('2026-10-10'));
  return { regions, services: services.map((service) => ({ ...service, regionCode: service.id })), history, totalEnergyKwh: history.reduce((sum, point) => sum + point.energyKwh, 0), totalEmissionsG: history.reduce((sum, point) => sum + point.emissionsG, 0), lastCollectionAt: history.at(-1)?.collectedAt ?? null };
}
