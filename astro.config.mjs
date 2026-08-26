import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
//
// output: "server" — el admin y sus API routes necesitan SSR (leen/escriben
// en Postgres en cada request). Las páginas públicas usan
// `export const prerender = false` sólo donde el contenido viene de la base
// de datos (la home), para que un cambio en el admin se vea sin rebuild.
//
// El adapter es la ÚNICA pieza atada al hosting. Migrar de Vercel a un
// contenedor Docker más adelante es: cambiar `vercel()` por
// `node({ mode: "standalone" })` de `@astrojs/node` — nada del resto del
// código (rutas, auth, acceso a datos) depende de Vercel.
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
