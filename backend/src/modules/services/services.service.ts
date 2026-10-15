import {
    fetchAvailableServices,
    type AggregatorService,
} from "../../integrations/metrics-api.js";

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