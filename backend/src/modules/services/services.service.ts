import {
    fetchAvailableServices,
    fetchServiceMetrics,
    type AggregatorService,
    type ServiceMetrics,
} from "../../integrations/metrics-api.js";

type ServicesFetcher = () => Promise<AggregatorService[]>;

export interface CollectedServiceMetrics {
    serviceId: string;
    metrics: ServiceMetrics;
    updatedAt: string;
}

type MetricsFetcher = (
    serviceId: string
) => Promise<ServiceMetrics>;

let fetchServices: ServicesFetcher = fetchAvailableServices;
let fetchMetrics: MetricsFetcher = fetchServiceMetrics;

let discoveredServices: AggregatorService[] = [];
let lastUpdatedAt: string | null = null;

const collectedMetrics = new Map<string, CollectedServiceMetrics>();

export async function refreshDiscoveredServices(): Promise<void> {
    const services = await fetchServices();

    // Atualiza a lista somente após uma consulta bem-sucedida.
    discoveredServices = services;
    lastUpdatedAt = new Date().toISOString();
}

export function getDiscoveredServices(): AggregatorService[] {
    return discoveredServices;
}

export function getServicesLastUpdatedAt(): string | null {
    return lastUpdatedAt;
}

// Consulta as métricas de todos os serviços descobertos.
// Uma falha individual não interrompe as consultas seguintes.
export async function refreshServiceMetrics(): Promise<void> {
    for (const service of discoveredServices) {
        try {
            const metrics = await fetchMetrics(service.id);

            collectedMetrics.set(service.id, {
                serviceId: service.id,
                metrics,
                updatedAt: new Date().toISOString(),
            });
        } catch (error: unknown) {
            console.error(
                `Falha ao consultar métricas do serviço "${service.id}".`,
                error
            );
            // Mantém as últimas métricas válidas desse serviço.
        }
    }
}

export function getCollectedServiceMetrics(): CollectedServiceMetrics[] {
    return Array.from(collectedMetrics.values());
}

export function getCollectedMetricsByServiceId(
    serviceId: string
): CollectedServiceMetrics | undefined {
    return collectedMetrics.get(serviceId);
}

// Permite substituir a consulta de serviços durante testes.
export function setServicesFetcherForTesting(
    fetcher: ServicesFetcher
): void {
    fetchServices = fetcher;
}

export function resetServicesFetcher(): void {
    fetchServices = fetchAvailableServices;
}

// Permite substituir a consulta de métricas durante testes.
export function setMetricsFetcherForTesting(
    fetcher: MetricsFetcher
): void {
    fetchMetrics = fetcher;
}

export function resetMetricsFetcher(): void {
    fetchMetrics = fetchServiceMetrics;
}
