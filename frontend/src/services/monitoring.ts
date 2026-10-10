import type { CarbonRegion, MonitoringSnapshot, MonitoredService } from '../types/monitoring';
import { findCountry, localizeCity } from '../data/geography';

const METRICS_API = 'https://metrics.unilaunch.org';
const CARBON_API = 'https://carbon.unilaunch.org';
const object = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
const number = (value: unknown, max = Infinity): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

async function request(url: string, signal: AbortSignal) {
  return fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]), cache: 'no-store' });
}

function location(value: unknown) {
  const data = object(value);
  const country = text(data.country);
  const latitude = typeof data.latitude === 'number' && Number.isFinite(data.latitude) && Math.abs(data.latitude) <= 90 ? data.latitude : undefined;
  const longitude = typeof data.longitude === 'number' && Number.isFinite(data.longitude) && Math.abs(data.longitude) <= 180 ? data.longitude : undefined;
  if (!country || !text(data.region) || latitude === undefined || longitude === undefined || data.city != null && typeof data.city !== 'string') throw new Error('Localização inválida na API.');
  return { country: findCountry(country)?.properties.name ?? country, region: text(data.region), city: localizeCity(country, text(data.city) || null), latitude, longitude };
}

function parseRegions(value: unknown): CarbonRegion[] {
  const data = object(value);
  if (!Array.isArray(data.regions)) throw new Error('Catálogo de regiões inválido.');
  return data.regions.map((entry: unknown) => {
    const region = object(entry);
    const carbonIntensity = number(region.carbon_intensity_gco2e_per_kwh);
    const renewablePercent = number(region.renewable_share_percent, 100);
    if (!text(region.code) || carbonIntensity === null || renewablePercent === null) throw new Error('Fator de carbono inválido.');
    return { code: text(region.code), ...location(region), carbonIntensity, renewablePercent };
  });
}

// Coefficients required by the challenge's simplified model, in W and W/GB.
export function estimateEnergy(cpu: number, memory: number, disk: number, network: number, seconds: number) {
  return (cpu / 100 * 100 + memory * 0.375 + disk * 0.01 + network * 0.02) * (seconds / 3600) / 1000;
}

export async function getMonitoringSnapshot(signal = new AbortController().signal): Promise<MonitoringSnapshot> {
  const [servicesResponse, regionsResponse] = await Promise.all([
    request(`${METRICS_API}/services`, signal),
    request(`${CARBON_API}/regions`, signal).catch(() => null),
  ]);
  if (!servicesResponse.ok) throw new Error(`Agregador indisponível (HTTP ${servicesResponse.status}).`);
  const summaries: unknown = await servicesResponse.json();
  if (!Array.isArray(summaries)) throw new Error('Lista de serviços inválida.');
  let regions: CarbonRegion[] = [];
  let warning: string | undefined;
  try {
    if (!regionsResponse?.ok) throw new Error('API de carbono indisponível.');
    regions = parseRegions(await regionsResponse.json());
  } catch { warning = 'Não foi possível obter os fatores de carbono. As métricas disponíveis continuam visíveis; emissões sem fator são exibidas como —.'; }

  const services = await Promise.all(summaries.map(async (entry: unknown): Promise<MonitoredService> => {
    const summary = object(entry), place = object(summary.location);
    if (!text(summary.id) || !text(summary.name) || !text(place.region_code)) throw new Error('Serviço inválido na API.');
    const regionCode = text(place.region_code);
    const factor = regions.find((region) => region.code === regionCode);
    const service: MonitoredService = {
      id: text(summary.id), name: text(summary.name), ...location(place), regionCode, status: 'unavailable',
      cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null, energyKwh: null, emissionsG: null,
      collectionIntervalSeconds: null, carbonIntensity: factor?.carbonIntensity ?? null, renewablePercent: factor?.renewablePercent ?? null,
    };
    try {
      const response = await request(`${METRICS_API}/metrics/${encodeURIComponent(service.id)}`, signal);
      const data = object(await response.json().catch(() => null));
      if (!response.ok) {
        const reason = text(data.error);
        service.status = reason.includes('metric') ? 'no-metrics' : response.status === 404 ? 'removed' : 'unavailable';
        service.statusMessage = `${text(data.message) || 'Falha ao consultar métricas'} (HTTP ${response.status}).`;
        return service;
      }
      const metrics = object(data.metrics);
      service.cpuPercent = number(metrics.cpu_percent, 100);
      service.memoryGb = number(metrics.memory_gb);
      service.diskGb = number(metrics.disk_gb);
      service.networkGb = number(metrics.network_gb);
      service.collectionIntervalSeconds = number(data.collection_interval_seconds);
      if ([service.cpuPercent, service.memoryGb, service.diskGb, service.networkGb, service.collectionIntervalSeconds].some((value) => value === null)) {
        service.status = 'no-metrics';
        const missing = [['CPU', service.cpuPercent], ['memória RAM', service.memoryGb], ['disco', service.diskGb], ['rede', service.networkGb], ['intervalo de coleta', service.collectionIntervalSeconds]].filter(([, value]) => value === null).map(([label]) => label);
        service.statusMessage = `Métricas ausentes ou inválidas: ${missing.join(', ')}.`;
        return service;
      }
      service.status = 'available';
      service.energyKwh = estimateEnergy(service.cpuPercent!, service.memoryGb!, service.diskGb!, service.networkGb!, service.collectionIntervalSeconds!);
      service.emissionsG = factor ? service.energyKwh * factor.carbonIntensity : null;
      if (!factor) service.statusMessage = `Fator de carbono não disponível para ${regionCode}.`;
    } catch {
      if (signal.aborted) throw new DOMException('Coleta cancelada', 'AbortError');
      service.statusMessage = 'Não foi possível consultar as métricas deste serviço.';
    }
    return service;
  }));
  signal.throwIfAborted();
  const collectedAt = new Date().toISOString();
  const history = services.flatMap((service) => service.energyKwh !== null ? [{ serviceId: service.id, regionCode: service.regionCode, country: service.country, city: service.city, collectedAt, energyKwh: service.energyKwh, emissionsG: service.emissionsG }] : []);
  return { regions, services, history, totalEnergyKwh: history.length ? history.reduce((sum, point) => sum + point.energyKwh, 0) : null, totalEmissionsG: history.some((point) => point.emissionsG !== null) ? history.reduce((sum, point) => sum + (point.emissionsG ?? 0), 0) : null, lastCollectionAt: collectedAt, warning };
}
