import type { CarbonRegion, MonitoringSnapshot, MonitoredService } from '../types/monitoring';
import { findCountry, localizeCity } from '../data/geography';
import { summarizeCollections } from '../utils/history';

const BACKEND_API = (import.meta.env?.VITE_BACKEND_URL ?? '/backend').replace(/\/+$/, '');
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

function parseRegions(value: unknown) {
  const data = object(value);
  if (!Array.isArray(data.regions)) throw new Error('Catálogo de regiões inválido.');
  const regions: CarbonRegion[] = [];
  let invalidCount = 0;
  for (const entry of data.regions) {
    try {
      const region = object(entry);
      const carbonIntensity = number(region.carbon_intensity_gco2e_per_kwh);
      const renewablePercent = number(region.renewable_share_percent, 100);
      const code = text(region.code);
      if (!code || carbonIntensity === null || renewablePercent === null || regions.some((item) => item.code === code)) throw new Error('Fator de carbono inválido.');
      regions.push({ code, ...location(region), carbonIntensity, renewablePercent });
    } catch { invalidCount++; }
  }
  return { regions, invalidCount };
}

// Coefficients required by the challenge's simplified model, in W and W/GB.
export function estimateEnergy(cpu: number, memory: number, disk: number, network: number, seconds: number) {
  return (cpu / 100 * 100 + memory * 0.375 + disk * 0.01 + network * 0.02) * (seconds / 3600) / 1000;
}

export async function getMonitoringSnapshot(signal = new AbortController().signal): Promise<MonitoringSnapshot> {
  const [servicesResponse, regionsResponse] = await Promise.all([
    request(BACKEND_API + '/services', signal),
    request(CARBON_API + '/regions', signal).catch(() => null),
  ]);
  if (!servicesResponse.ok) throw new Error('Backend indisponível (HTTP ' + servicesResponse.status + ').');
  const discovery = object(await servicesResponse.json());
  if (!Array.isArray(discovery.services)) throw new Error('Resposta inválida do backend: esperados services e lastUpdatedAt.');
  if (discovery.lastUpdatedAt === null) throw new Error('O backend ainda não concluiu a descoberta de serviços. Aguarde e tente atualizar.');
  if (typeof discovery.lastUpdatedAt !== 'string' || !Number.isFinite(Date.parse(discovery.lastUpdatedAt))) throw new Error('Data de descoberta inválida no backend.');
  const discoveryUpdatedAt = discovery.lastUpdatedAt;
  const warnings: string[] = [];
  if (Date.now() - Date.parse(discoveryUpdatedAt) > 90_000) warnings.push('A descoberta do backend está desatualizada. A lista pode não refletir mudanças recentes.');
  let regions: CarbonRegion[] = [];
  try {
    if (!regionsResponse?.ok) throw new Error('API de carbono indisponível.');
    const parsed = parseRegions(await regionsResponse.json());
    regions = parsed.regions;
    if (parsed.invalidCount) warnings.push(parsed.invalidCount + ' região(ões) inválida(s) ignorada(s). Os fatores válidos foram preservados.');
  } catch { warnings.push('Não foi possível obter os fatores de carbono. As métricas disponíveis continuam visíveis; emissões sem fator são exibidas como —.'); }

  let discoveryComplete = true;
  const seenIds = new Set<string>();
  const services: MonitoredService[] = [];
  const valid: MonitoredService[] = [];
  for (const entry of discovery.services) {
    const summary = object(entry), place = object(summary.location);
    const id = text(summary.id);
    if (!id || seenIds.has(id)) {
      discoveryComplete = false;
      warnings.push('Cadastro de serviço sem identificador válido ou duplicado ignorado. Remoções não serão inferidas nesta consulta.');
      continue;
    }
    seenIds.add(id);
    const factor = regions.find((region) => region.code === text(place.region_code));
    const service: MonitoredService = {
      id, name: text(summary.name) || id, country: null, region: null, city: null, regionCode: text(place.region_code),
      status: 'no-metrics', cpuPercent: null, memoryGb: null, diskGb: null, networkGb: null,
      energyKwh: null, emissionsG: null, collectionIntervalSeconds: null,
      carbonIntensity: factor?.carbonIntensity ?? null, renewablePercent: factor?.renewablePercent ?? null,
    };
    services.push(service);
    try {
      if (!text(summary.name) || !service.regionCode) throw new Error('Nome ou código regional ausente.');
      Object.assign(service, location(place));
      valid.push(service);
    } catch {
      service.statusMessage = 'Cadastro de serviço inválido. Os demais serviços continuam sendo consultados.';
      warnings.push('Cadastro inválido: ' + service.name + '.');
    }
  }

  async function collect(service: MonitoredService) {
    service.status = 'unavailable';
    try {
      const response = await request(METRICS_API + '/metrics/' + encodeURIComponent(service.id), signal);
      const data = object(await response.json().catch(() => null));
      if (!response.ok) {
        service.status = response.status === 404 ? 'removed' : text(data.error) === 'metrics_missing' ? 'no-metrics' : 'unavailable';
        service.statusMessage = (text(data.message) || 'Falha ao consultar métricas') + ' (HTTP ' + response.status + ').';
        return;
      }
      const metrics = object(data.metrics);
      service.cpuPercent = number(metrics.cpu_percent, 100);
      service.memoryGb = number(metrics.memory_gb);
      service.diskGb = number(metrics.disk_gb);
      service.networkGb = number(metrics.network_gb);
      const interval = number(data.collection_interval_seconds);
      service.collectionIntervalSeconds = interval !== null && Number.isSafeInteger(interval) ? interval : null;
      if ([service.cpuPercent, service.memoryGb, service.diskGb, service.networkGb, service.collectionIntervalSeconds].some((value) => value === null)) {
        service.status = 'no-metrics';
        const missing = [['CPU', service.cpuPercent], ['memória RAM', service.memoryGb], ['disco', service.diskGb], ['rede', service.networkGb], ['intervalo de coleta', service.collectionIntervalSeconds]].filter(([, value]) => value === null).map(([label]) => label);
        service.statusMessage = 'Métricas ausentes ou inválidas: ' + missing.join(', ') + '.';
        return;
      }
      service.energyKwh = number(estimateEnergy(service.cpuPercent!, service.memoryGb!, service.diskGb!, service.networkGb!, service.collectionIntervalSeconds!));
      service.emissionsG = service.energyKwh !== null && service.carbonIntensity != null ? number(service.energyKwh * service.carbonIntensity) : null;
      service.status = service.energyKwh === null ? 'no-metrics' : 'available';
      if (service.energyKwh === null) service.statusMessage = 'Resultado energético inválido.';
      else if (service.emissionsG === null) service.statusMessage = 'Fator de carbono ou resultado de emissão não disponível para ' + service.regionCode + '.';
    } catch {
      if (signal.aborted) throw new DOMException('Coleta cancelada', 'AbortError');
      service.statusMessage = 'Não foi possível consultar as métricas deste serviço.';
    }
  }
  for (let start = 0; start < valid.length; start += 6) {
    signal.throwIfAborted();
    await Promise.all(valid.slice(start, start + 6).map(collect));
  }
  signal.throwIfAborted();
  const collectedAt = new Date().toISOString();
  const history = services.flatMap((service) => service.energyKwh !== null ? [{
    serviceId: service.id, regionCode: service.regionCode, country: service.country, city: service.city,
    collectedAt, energyKwh: service.energyKwh, emissionsG: service.emissionsG, intervalSeconds: service.collectionIntervalSeconds ?? 0,
  }] : []);
  const totals = summarizeCollections(history);
  const covered = services.filter((service) => service.status !== 'removed' && service.emissionsG !== null).length;
  const expected = services.filter((service) => service.status !== 'removed').length;
  if (expected && covered < expected) warnings.push('Emissões parciais: calculadas para ' + covered + ' de ' + expected + ' serviços nesta consulta.');
  return { regions, services, history, totalEnergyKwh: totals.energyKwh, totalEmissionsG: totals.emissionsG,
    lastCollectionAt: collectedAt, discoveryUpdatedAt, discoveryComplete, warning: warnings.length ? warnings.join(' ') : undefined };
}
