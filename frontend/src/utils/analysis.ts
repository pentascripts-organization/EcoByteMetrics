import type { MonitoringSnapshot, Period } from '../types/monitoring';
import { matchesRegion } from './region';
import { summarizeCollections } from './history';

export function isPeriod(value: unknown): value is Period {
  return value === '24h' || value === '7d' || value === '30d';
}

export function analysisQuery(search: string) {
  const input = new URLSearchParams(search);
  const result = new URLSearchParams();
  for (const key of ['pais', 'cidade', 'regiao', 'periodo', 'ate']) {
    const value = input.get(key);
    if (value && (key !== 'periodo' || isPeriod(value))) result.set(key, value);
  }
  return result;
}

export function analysisLink(path: string, search: string) {
  const params = analysisQuery(search);
  if (path.startsWith('/servicos')) {
    const input = new URLSearchParams(search);
    for (const key of ['busca', 'estado', 'ordem']) {
      const value = input.get(key);
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return path + (query ? '?' + query : '');
}

export function getAnalysis(snapshot: MonitoringSnapshot, period: Period, search: string) {
  const params = new URLSearchParams(search);
  const regionCode = params.get('regiao') ?? '';
  const selectedRegion = snapshot.regions.find((region) => region.code === regionCode);
  const country = selectedRegion?.country ?? params.get('pais') ?? '';
  const city = selectedRegion?.city ?? params.get('cidade') ?? '';
  const date = params.get('ate') ?? '';
  const regional = Boolean(regionCode || country || city);
  const services = snapshot.services.filter((service) => regionCode ? service.regionCode === regionCode : matchesRegion(service, country, city));
  const invalidDate = Boolean(date && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(date) || !Number.isFinite(Date.parse(date))));
  const end = Date.parse(date || snapshot.lastCollectionAt || '');
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
  const start = end - days * 86400_000;
  const history = snapshot.history.filter((point) => {
    const timestamp = Date.parse(point.collectedAt);
    if (invalidDate || !Number.isFinite(end) || timestamp <= start || timestamp > end) return false;
    if (!regional) return true;
    if (regionCode) return point.regionCode ? point.regionCode === regionCode : services.some((service) => service.id === point.serviceId);
    return point.country ? matchesRegion({ country: point.country, city: point.city ?? null }, country, city) : services.some((service) => service.id === point.serviceId);
  });
  const regions = snapshot.regions.filter((region) => regionCode ? region.code === regionCode : regional ? matchesRegion(region, country, city) : services.some((service) => service.status !== 'removed' && service.regionCode === region.code));
  return { services, history, regions, country, city, regionCode, date, regional, invalidDate,
    selection: [country, city].filter(Boolean).join(' — ') || (regionCode ? 'Região ' + regionCode : ''),
    totals: summarizeCollections(history) };
}
