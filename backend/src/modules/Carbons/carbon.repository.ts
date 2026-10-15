import pool from "../../db/connection";

export type Carbon = {
  id_carbon: number;
  id_location: number;
  intensity_carbon: number;
  renewable_percentage_carbon: number;
  timestamp_carbon: Date;
};

export type CreateCarbonInput = Omit<Carbon, "id_carbon">;

export async function createCarbonRepository({id_location, intensity_carbon, renewable_percentage_carbon, timestamp_carbon}: CreateCarbonInput): Promise<Carbon> {
    const result = await pool.query(
        "INSERT INTO carbons (id_location, intensity_carbon, renewable_percentage_carbon, timestamp_carbon) VALUES ($1, $2, $3, $4) RETURNING *",
        [id_location, intensity_carbon, renewable_percentage_carbon, timestamp_carbon]
    );
    return result.rows[0];
}

export async function getCarbonByIdRepository(id_carbon: number): Promise<Carbon | null> {
    const result = await pool.query("SELECT * FROM carbons WHERE id_carbon = $1", [id_carbon]);
    return result.rows[0] || null;
}

export async function listCarbonsByLocationIdRepository(id_location: number): Promise<Carbon[]> {
    const result = await pool.query("SELECT * FROM carbons WHERE id_location = $1", [id_location]);
    return result.rows;
} 

export async function listCarbonsRepository(): Promise<Carbon[]> {
    const result = await pool.query("SELECT * FROM carbons");
    return result.rows || [];
}


