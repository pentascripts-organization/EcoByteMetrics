import pool from "../../db/connection";
import { Carbon } from "../Carbons/carbon.repository";
import { Service } from "../Services/service.repository";

export type Location = {
  id_location: number;
  name_location: string;
  country_location: string;
  city_location: string;
  region_location: string;
  latitude_location: number;
  longitude_location: number;
  service: Service | null;
  carbon: Carbon | null;
};

export type createLocationInput = Omit<Location, "id_location">; 

export async function createLocationRepository({name_location, country_location, city_location, region_location, latitude_location, longitude_location}: createLocationInput): Promise<Location> {
    const result = await pool.query(
        "INSERT INTO locations (name_location, country_location, city_location, region_location, latitude_location, longitude_location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name_location, country_location, city_location, region_location, latitude_location, longitude_location]
    );
    return result.rows[0];
}

export async function getLocationByIdRepository(id_location: number): Promise<Location | null> {
    const result = await pool.query("SELECT * FROM locations WHERE id_location = $1", [id_location]);
    return result.rows[0] || null;
}

export async function listLocationsRepository(): Promise<Location[]> {
    const result = await pool.query("SELECT * FROM locations");
    return result.rows || [];
} 