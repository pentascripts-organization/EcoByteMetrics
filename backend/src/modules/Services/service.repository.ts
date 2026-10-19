import pool from "../../db/connection";
import { Metric } from "../Metrics/metric.repository";

export type Service = {
  id_service: number;
  id_location: number;
  name_service: string;
  MatricPath_service: string;
  metric: Metric[] | null;
};

export type createServiceInput = Omit<Service, "id_service">;
export type UpdateService = Service;

export async function createServiceRepository({id_location, name_service, MatricPath_service}: createServiceInput): Promise<Service> {
    const result = await pool.query(
        "INSERT INTO services (id_location, name_service, MatricPath_service) VALUES ($1, $2, $3) RETURNING *",
        [id_location, name_service, MatricPath_service]
    );
    return result.rows[0];
}
export async function getServiceByIdRepository(id_service: number): Promise<Service | null> {
    const result = await pool.query("SELECT * FROM services WHERE id_service = $1", [id_service]);
    return result.rows[0] || null;
}

export async function listServicesByLocationIdRepository(id_location: number): Promise<Service> {
    const result = await pool.query("SELECT * FROM services WHERE id_location = $1", [id_location]);
    return result.rows[0] || null;
}

export async function listServicesRepository(): Promise<Service[]> {
    const result = await pool.query("SELECT * FROM services");
    return result.rows;
}