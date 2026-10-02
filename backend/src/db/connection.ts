import { Pool } from "pg";

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: String(process.env.POSTGRES_PASSWORD),
    database: process.env.POSTGRES_DATABASE,
    port: Number(process.env.POSTGRES_PORT)
});

export default pool;