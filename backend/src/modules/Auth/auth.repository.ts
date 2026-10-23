/* Consulta o usuário no PostgreSQL por meio de SQL parametrizado. */
import pool from "../../db/connection";

export type AuthUser = {
  id_user: number;
  email_user: string;
  password_user: string;
};

export async function getUserByEmailRepository(
  email: string
): Promise<AuthUser | null> {
  const result = await pool.query(
    `SELECT id_user, email_user, password_user
     FROM users
     WHERE email_user = $1
     LIMIT 1`,
    [email]
  );

  return result.rows[0] ?? null;
}