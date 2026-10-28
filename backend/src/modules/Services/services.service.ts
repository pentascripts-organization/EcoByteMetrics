import {
    fetchAvailableServices,
    fetchServiceMetrics,
    type AggregatorService,
    type ServiceMetrics,
} from "../../integrations/metrics-api.js";
import {
    fetchCarbonRegions,
    type CarbonRegionFactor,
} from "../../integrations/carbon-api.js";
import {
    persistAggregatorServices,
    persistMetricSample,
} from "../Statistics/statistics.repository.js";

import {
    Service,
    createServiceRepository,
    getServiceByIdRepository,
    listServicesByLocationIdRepository,
    listServicesRepository
} from "./service.repository.js";

export class ServicesError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = "ServicesError";
    }
}

function validateServiceId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ServicesError("ID do serviço inválido", 400);
    }
}
function validateLocationId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ServicesError("ID do Localização inválido", 400);
    }
}

function validadeServiceInput(serviceInput: Omit<Service, "id_service">): Omit<Service, "id_service"> {
    if (!serviceInput.id_location || !Number.isSafeInteger(serviceInput.id_location) || serviceInput.id_location <= 0) {
        throw new ServicesError("ID da localização inválido", 400);
    }
    if (!serviceInput.name_service || serviceInput.name_service.trim() === "") {
        throw new ServicesError("Nome do serviço inválido", 400);
    }
    if (!serviceInput.MatricPath_service || serviceInput.MatricPath_service.trim() === "") {
        throw new ServicesError("Caminho da métrica inválido", 400);
    }
    if (!serviceInput.MatricPath_service.startsWith("/")) {
        throw new ServicesError("Caminho da métrica deve começar com '/'", 400);
    }
    return serviceInput;
}

function handleRepositoryError(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new ServicesError("Já existe um serviço com esse nome.", 409);
    }
    throw error; 
}

export async function createService(service:Service):Promise<Service> {
    const data = validadeServiceInput(service)
    try{
        const service = await createServiceRepository(data)
        return service;
    }catch(error){
        handleRepositoryError(error)
    }
}

export async function getServiceById(id_service:number):Promise<Service> {
    validateServiceId(id_service)
    const service = await getServiceByIdRepository(id_service)
    if(!service){
        throw new ServicesError("Serviço não encotrado", 404)
    }
    return service;
}

export async function listServiceByLocation(id_location:number):Promise<Service> {
    validateLocationId(id_location);
    const service = await listServicesByLocationIdRepository(id_location)
    if(!service){
        throw new ServicesError("Serviço não encotrado", 404)
    }
    return service;
}

export async function listServices():Promise<Service[]> {
    const service = await listServicesRepository()
    if(service.length === 0){
        throw new ServicesError("Não existe serviço", 404)
    }
    return service;
}

// função de agregação para criar um novo serviço
type ServicesFetcher = () => Promise<AggregatorService[]>;

export interface CollectedServiceMetrics {
    serviceId: string;
    metrics: ServiceMetrics;
    updatedAt: string;
}

type MetricsFetcher = (
    serviceId: string
) => Promise<ServiceMetrics>;
type CarbonRegionsFetcher = () => Promise<CarbonRegionFactor[]>;
type ServicesPersister = typeof persistAggregatorServices;
type MetricSamplePersister = typeof persistMetricSample;

let fetchServices: ServicesFetcher = fetchAvailableServices;
let fetchMetrics: MetricsFetcher = fetchServiceMetrics;
let fetchCarbonFactors: CarbonRegionsFetcher = fetchCarbonRegions;
let saveServices: ServicesPersister = persistAggregatorServices;
let saveMetricSample: MetricSamplePersister = persistMetricSample;

let discoveredServices: AggregatorService[] = [];
let lastUpdatedAt: string | null = null;

const collectedMetrics = new Map<string, CollectedServiceMetrics>();

export async function refreshDiscoveredServices(): Promise<void> {
    try {
        const services = await fetchServices();

        try {
            await saveServices(services);
        } catch (error: unknown) {
            console.error(
                "Falha ao persistir serviços descobertos.",
                error
            );
        }

        // Atualiza a lista somente após uma consulta bem-sucedida.
        discoveredServices = services;
        lastUpdatedAt = new Date().toISOString();
    } catch (error: unknown) {
        console.error(
            "Falha ao consultar serviços descobertos.",
            error
        );
    }
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
    let carbonFactors = new Map<string, number>();
    try {
        carbonFactors = new Map(
            (await fetchCarbonFactors()).map((factor) => [
                factor.code,
                factor.carbonIntensity,
            ])
        );
    } catch (error: unknown) {
        console.error("Falha ao consultar fatores de carbono.", error);
    }

    for (const service of discoveredServices) {
        let metrics: ServiceMetrics;
        try {
            metrics = await fetchMetrics(service.id);
        } catch (error: unknown) {
            console.error(
                `Falha ao consultar métricas do serviço "${service.id}".`,
                error
            );
            continue;
        }

        const collectedAt = new Date();
        collectedMetrics.set(service.id, {
            serviceId: service.id,
            metrics,
            updatedAt: collectedAt.toISOString(),
        });

        try {
            await saveMetricSample(
                service.id,
                metrics,
                carbonFactors.get(service.location.region_code) ?? null,
                collectedAt
            );
        } catch (error: unknown) {
            console.error(
                `Falha ao persistir métricas do serviço "${service.id}".`,
                error
            );
        }
    }
}

export function getCollectedServiceMetrics(): CollectedServiceMetrics[] {
    return Array.from(collectedMetrics.values());
}

export function getCollectedMetricsByServiceId(serviceId: string): CollectedServiceMetrics | undefined {
    return collectedMetrics.get(serviceId);
}

// Permite substituir a consulta de serviços durante testes.
export function setServicesFetcherForTesting(fetcher: ServicesFetcher): void {
    fetchServices = fetcher;
}

export function resetServicesFetcher(): void {
    fetchServices = fetchAvailableServices;
}

// Permite substituir a consulta de métricas durante testes.
export function setMetricsFetcherForTesting(fetcher: MetricsFetcher
): void {
    fetchMetrics = fetcher;
}

export function resetMetricsFetcher(): void {
    fetchMetrics = fetchServiceMetrics;
}

export function setCarbonRegionsFetcherForTesting(
    fetcher: CarbonRegionsFetcher
): void {
    fetchCarbonFactors = fetcher;
}

export function resetCarbonRegionsFetcher(): void {
    fetchCarbonFactors = fetchCarbonRegions;
}

export function setPersistenceForTesting(
    servicesPersister: ServicesPersister,
    metricPersister: MetricSamplePersister
): void {
    saveServices = servicesPersister;
    saveMetricSample = metricPersister;
}

export function resetPersistence(): void {
    saveServices = persistAggregatorServices;
    saveMetricSample = persistMetricSample;
}
