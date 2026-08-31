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

// max:3 — este showroom es de tráfico bajo así que el pool se mantiene
// chico, pero NO puede ser 1: varias páginas (home, /admin) ahora disparan
// más de un query en paralelo (Promise.all, ej. getAllProducts +
// getSectionTitles). Con max:1 esos queries concurrentes se pipelinean
// sobre la única conexión contra el pooler de Supabase (pgbouncer,
// transaction mode, puerto 6543) y el pipeline queda colgado sin error ni
// timeout — la request nunca resuelve. Con max:3 cada cadena de queries
// concurrente toma su propia conexión física y no compite por la misma.
// Subilo si el tráfico lo justifica.
//
// fetch_types:false — evita que postgres.js dispare su query interna de
// introspección de tipos (contra pg_catalog.pg_type) intercalada con las
// demás; de más está contra un pooler en transaction mode, donde cada
// statement puede terminar en un backend distinto.
//
// idle_timeout:20 — el pooler de Supabase (pgbouncer, puerto 6543) cierra por
// su cuenta las conexiones inactivas. Sin esto, postgres.js mantiene vivo un
// socket que ya está muerto del otro lado, y la primera query después de un
// rato sin tráfico revienta con CONNECTION_CLOSED en vez de reconectar. Con
// idle_timeout reciclamos la conexión nosotros antes de que el pooler lo haga.
//
// connect_timeout:10 — en dev contra un Postgres remoto (Supabase), sin esto
// una conexión que no llega a establecerse (pooler frío, hiccup de red) deja
// la request colgada sin límite: la carga de "/" nunca resuelve y el
// navegador se queda girando indefinidamente. Con el timeout, en el peor
// caso falla rápido con un error visible en vez de tildarse.
const client = postgres(connectionString, {
  prepare: false,
  fetch_types: false,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
