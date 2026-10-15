import { ServicesError } from "../Services/services.service";
import {
    Metric,
    createMetricRepository,
    getMetricByIdRepository,
    listMetricsByServiceIdRepository,
    CreateMetricInput
}   from "./metric.repository";

export class MetricError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = "MetricError";
    }
}

function validateMetricId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new MetricError("ID da métrica inválido", 400);
    }
}
function validateServiceId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ServicesError("ID do serviço inválido", 400);
    }
}

function validateMetricInput(metricInput: CreateMetricInput): CreateMetricInput  {
    if (!metricInput.id_service || !Number.isSafeInteger(metricInput.id_service) || metricInput.id_service <= 0) {
        throw new MetricError("ID do serviço inválido", 400);
    }
    if (metricInput.cpu_metric < 0 || metricInput.cpu_metric > 100) {
        throw new MetricError("Valor de CPU inválido", 400);
    }
    if (metricInput.memory_metric < 0 || metricInput.memory_metric > 100) {
        throw new MetricError("Valor de memória inválido", 400);
    }   
    if (metricInput.disk_metric < 0 || metricInput.disk_metric > 100) {
        throw new MetricError("Valor de disco inválido", 400);
    }
    if (metricInput.collected_interval_metric <= 0) {
        throw new MetricError("Intervalo de coleta inválido", 400);
    }
    if (!metricInput.timestamp_metric || isNaN(new Date(metricInput.timestamp_metric).getTime())) {
        throw new MetricError("Timestamp inválido", 400);
    }
    return metricInput;
}

function handleRepositoryError(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new MetricError("Já existe uma métrica com esse ID.", 409);
    }
    throw error;
}

export async function  createMetricService(metricInput: CreateMetricInput): Promise<Metric> {
    const data = validateMetricInput(metricInput);  
    try{
        const metric = await createMetricRepository(data);
        return metric;
    }
    catch (error) {
        handleRepositoryError(error);
    }
}

export async function getMetricByIdService(id_metric: number): Promise<Metric | null> {
    validateMetricId(id_metric);
    const metric = await getMetricByIdRepository(id_metric);
    if(!metric) {
        throw new MetricError("Métrica não encontrada", 404);
    }
    return metric;
}

export async function listMetricsByServiceIdService(id_service: number): Promise<Metric[]> {
    validateServiceId(id_service);
    const metrics = await listMetricsByServiceIdRepository(id_service);
    if (metrics.length === 0) {
        throw new ServicesError("Nenhuma métrica encontrada para o serviço especificado", 404);
    }
    return metrics;
}
    
