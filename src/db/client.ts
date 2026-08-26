import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está definida. Copiá .env.example a .env y completá la conexión a Postgres (local: docker-compose, demo: Supabase)."
  );
}

// max:1 — este showroom es de tráfico bajo; un pool chico evita agotar el
// límite de conexiones simultáneas de un Postgres gratuito (Supabase, etc.).
// Subilo si el tráfico lo justifica.
const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });
