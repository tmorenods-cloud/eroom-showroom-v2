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
//
// idle_timeout:20 — el pooler de Supabase (pgbouncer, puerto 6543) cierra por
// su cuenta las conexiones inactivas. Sin esto, postgres.js mantiene vivo un
// socket que ya está muerto del otro lado, y la primera query después de un
// rato sin tráfico revienta con CONNECTION_CLOSED en vez de reconectar. Con
// idle_timeout reciclamos la conexión nosotros antes de que el pooler lo haga.
const client = postgres(connectionString, { prepare: false, max: 1, idle_timeout: 20 });

export const db = drizzle(client, { schema });
