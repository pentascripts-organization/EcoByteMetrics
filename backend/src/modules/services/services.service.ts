import {
    fetchAvailableServices,
    type AggregatorService,
} from "../../integrations/metrics-api.js";

type ServicesFetcher = () => Promise<AggregatorService[]>;

let fetchServices: ServicesFetcher = fetchAvailableServices;

let discoveredServices: AggregatorService[] = [];
let lastUpdatedAt: string | null = null;

export async function refreshDiscoveredServices(): Promise<void> {
    const services = await fetchServices();

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

// Permite substituir a consulta externa durante testes automatizados.
export function setServicesFetcherForTesting(
    fetcher: ServicesFetcher
): void {
    fetchServices = fetcher;
}

// Restaura a consulta real ao Agregador.
export function resetServicesFetcher(): void {
    fetchServices = fetchAvailableServices;
}