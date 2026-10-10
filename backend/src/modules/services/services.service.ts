import {
  fetchAvailableServices,
  type AggregatorService,
} from "../../integrations/metrics-api.js";

let discoveredServices: AggregatorService[] = [];
let lastUpdatedAt: string | null = null;

export async function refreshDiscoveredServices(): Promise<void> {
  const services = await fetchAvailableServices();

  // Só atualizamos o cache depois de uma consulta bem-sucedida.
  discoveredServices = services;
  lastUpdatedAt = new Date().toISOString();
}

export function getDiscoveredServices(): AggregatorService[] {
  return discoveredServices;
}

export function getServicesLastUpdatedAt(): string | null {
  return lastUpdatedAt;
}
