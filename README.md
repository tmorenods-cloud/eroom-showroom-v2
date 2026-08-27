# eRoom Suite — Showroom

Onepage del showroom de eRoom Suite (Astro + React islands + Tailwind v4),
con un panel admin simple para editar el contenido de cada tarjeta y sus
enlaces de PDF/Video/demo sin necesidad de un redeploy.

## Stack

- **Astro 5** (SSR, `output: "server"`) + **React** para las islas
  interactivas (`ProductCard`, `VideoModal`, el formulario del admin).
- **Tailwind CSS v4** — tokens de diseño en `src/styles/global.css`.
- **Postgres** vía **Drizzle ORM** — única fuente de verdad del contenido
  en producción (`src/data/products.json` es solo la semilla inicial).
- **Auth de admin**: password único + cookie firmada (HMAC), sin
  dependencias externas — ver `src/lib/session.ts`.

## Desarrollo local

Necesitás Node 20+. Hay dos formas de conectar `DATABASE_URL`:

**Opción A — Postgres local con Docker (recomendada, más rápida).**
Cada carga de la home hace SSR contra la base (`prerender = false` en
[src/pages/index.astro](src/pages/index.astro)), así que con Postgres en
`localhost` la latency es prácticamente cero.

```bash
npm install
cp .env.example .env          # completá ADMIN_PASSWORD y SESSION_SECRET
docker compose up -d          # levanta Postgres en localhost:5432
npm run db:generate           # genera la migración desde src/db/schema.ts
npm run db:migrate            # la aplica contra la base local
npm run db:seed               # carga los 15 productos desde products.json
npm run dev
```

**Opción B — apuntar directo a Supabase (o cualquier Postgres remoto).**
Sirve para no mantener dos bases sincronizadas, pero cada request de `/`
paga el round-trip de red hasta el proveedor — en una conexión mala o si el
pooler está frío, se va a sentir más lento que en local. `src/db/client.ts`
tiene `connect_timeout: 10`, así que en el peor caso una conexión que no
responde falla rápido con un error en vez de dejar la página cargando sin
límite.

```bash
npm install
cp .env.example .env          # pegá el DATABASE_URL de Supabase directamente
npm run dev
```

En ambos casos el sitio queda en `http://localhost:4321`, el admin en
`/admin` (password la que hayas puesto en `ADMIN_PASSWORD`).

## Deploy — demo en Vercel

1. Creá un proyecto Postgres gratis en [Supabase](https://supabase.com)
   (o el proveedor que prefieras) y copiá su connection string.
2. En Vercel, seteá las variables de entorno del proyecto:
   `DATABASE_URL` (la de Supabase), `ADMIN_PASSWORD`, `SESSION_SECRET`
   (`openssl rand -hex 32`).
3. Corré `npm run db:migrate` y `npm run db:seed` una vez, apuntando
   `DATABASE_URL` a esa misma base (localmente, con `.env` temporalmente
   apuntando a Supabase).
4. Deploy normal (`git push` / conectar el repo en Vercel).

## Migrar a Docker más adelante

Lo único atado a Vercel es el adapter en `astro.config.mjs`. Para
autohospedar:

```js
// import vercel from "@astrojs/vercel";
import node from "@astrojs/node";
// adapter: vercel(),
adapter: node({ mode: "standalone" }),
```

El resto del código (rutas, auth, acceso a datos) no cambia. La base de
datos puede ser la misma de Supabase o un Postgres propio en el mismo
`docker-compose.yml` que ya usás en desarrollo.

## Estructura

```
src/
  components/       Header, Footer, SectionTitle (Astro, estáticos)
                     ProductCard, VideoModal (React islands)
                     admin/ProductEditForm (React island)
  data/              types.ts, products.ts (capa de acceso a datos),
                     products.json (semilla)
  db/                schema.ts (Drizzle), client.ts (conexión)
  lib/session.ts     auth de admin (cookie firmada)
  middleware.ts      protege /admin y /api/admin
  pages/
    index.astro      onepage pública (SSR, lee de Postgres)
    admin/           login, dashboard, edición por producto
    api/admin/       login, logout, PUT de productos
  styles/global.css  design tokens (Tailwind v4 @theme)
```
