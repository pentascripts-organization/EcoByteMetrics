import pool from "../../db/connection";
import { Carbon } from "../Carbons/carbon.repository";
import { Service } from "../Services/service.repository";


export type Metric = {  
    id_metric: number;
    id_service: number;
    cpu_metric: number;
    memory_metric: number;
    disk_metric: number;
    collected_interval_metric: number;
    timestamp_metric: Date;
};

export type CreateMetricInput = Omit<Metric, "id_metric">;

export type createServiceInput = Omit<Service, "id_service">;



export async function createMetricRepository({id_service, cpu_metric, memory_metric, disk_metric, collected_interval_metric, timestamp_metric}: CreateMetricInput): Promise<Metric> {
    const result = await pool.query(
        "INSERT INTO metrics (id_service, cpu_metric, memory_metric, disk_metric, collected_interval_metric, timestamp_metric) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [id_service, cpu_metric, memory_metric, disk_metric, collected_interval_metric, timestamp_metric]
    );
    return result.rows[0];
}

export async function getMetricByIdRepository(id_metric: number): Promise<Metric | null> {
    const result = await pool.query("SELECT * FROM metrics WHERE id_metric = $1", [id_metric]);
    return result.rows[0] || null;
}

export async function listMetricsByServiceIdRepository(id_service: number): Promise<Metric[]> {
    const result = await pool.query("SELECT * FROM metrics WHERE id_service = $1", [id_service]);
    return result.rows;
}

