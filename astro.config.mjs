import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
//
// Sitio 100% estático: todo el contenido sale de src/data/*.json en build y
// el resultado (dist/) se sirve desde cualquier hosting estático. Vercel
// detecta Astro y publica dist/ sin necesidad de adapter.
export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
