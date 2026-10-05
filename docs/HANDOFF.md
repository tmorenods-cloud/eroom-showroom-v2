# Handoff: eRoom Showroom v2

_Actualizado: 2026-10-05_

## Resumen

El showroom pasó de ser una app Astro **SSR + panel admin + Postgres
(Supabase)** a un **sitio 100% estático** con el contenido hardcodeado en
JSON. El panel admin se separó por completo y quedó preservado aparte, sin
cambios.

| | Antes (rama `admin-supabase`) | Ahora (`main`) |
|---|---|---|
| Output | `output: "server"` + `@astrojs/vercel` | `output: "static"`, sin adapter |
| Datos | Postgres en Supabase vía Drizzle (`products`, `demos`, `site_settings`) | `src/data/products.json` + `src/data/site.json` |
| Edición | `/admin` con login (password + cookie HMAC) | Editar el JSON → commit → push |
| Home `/` | SSR: 2-3 queries a Supabase por request | HTML generado en build |
| Env vars | `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` | Ninguna |
| Dependencias | astro, react, drizzle-orm, postgres, @astrojs/vercel… | astro, react (+ sharp/tsx para el script de imágenes) |

## Dónde quedó el admin

- **Rama `admin-supabase`** en `origin`
  (github.com/tmorenods-cloud/eroom-showroom-v2): el commit `112ea8c` intacto,
  más `backup/supabase-data-2026-10-05.sql` con el dump de datos.
- **Copia local aislada**: `../eroom-showroom-admin` (clon de esa rama, **sin
  remote**). Para llevarla a su propio repositorio:
  ```bash
  cd ../eroom-showroom-admin
  git remote add origin https://github.com/<org>/<nuevo-repo>.git
  git push -u origin admin-supabase:main
  ```
- Para reactivarla, seguir su README: `.env` con las 3 variables, y después
  `db:migrate`, `db:seed` y `dev`. Si la base está vacía, se puede restaurar
  con `psql $DATABASE_URL -f backup/supabase-data-2026-10-05.sql`.

## Migración de datos

- Origen: proyecto Supabase `cysnsoxomvfsbbpgybjy` ("Showroom eRoom v2"),
  con 15 products, 16 demos y 2 site_settings.
- Los datos vivos de la BD resultaron **idénticos** a la semilla
  `products.json`: se comparó JSON contra JSON y coincidieron campo por campo
  y en el orden de las demos. Por eso `products.json` no cambió de contenido;
  solo se actualizó la nota `_fuente`.
- `site_settings` → `src/data/site.json`.
- **Las keys de los títulos están "cruzadas" a propósito:** la categoría
  `hotelero` agrupa productos que usa el huésped (Butler, Hotspot, TV…), así
  que su sección se titula "Herramientas para huéspedes", y viceversa. Así
  estaba en la BD y en los defaults del código; no es un bug de la migración.
- El proyecto de Supabase **no se tocó**. Una vez verificado el sitio
  estático en producción, se puede pausar o borrar. Esa decisión queda a
  cargo del dueño del proyecto.

## Formato de los datos

`src/data/products.json` → `productos[]`:

```json
{
  "id": "butler",                       // slug único
  "categoria": "hotelero",              // "hotelero" | "huesped"
  "orden": 1,                           // orden global (se ordena por esto)
  "titulo": "eRoom Butler",
  "descripcion": "…",
  "imagen": "/img/butler-mockup-card-1.webp",   // archivo en public/img/
  "demos": [{ "label": "Demo Butler", "url": "https://…" }],  // puede ser []
  "pdfUrl": "https://…",                // "" = sin botón PDF
  "videoUrl": "https://….mp4"           // "" = sin botón video
}
```

`src/data/site.json`:

```json
{ "sectionTitles": { "hotelero": "Herramientas para huéspedes", "huesped": "Herramientas para hoteleros" } }
```

`src/data/products.ts` valida el JSON en build: categoría válida, campos
requeridos, demos con label y url, ids únicos. Si algo falla, el build se
corta con un mensaje que dice qué producto falla.

### Recetas

- **Agregar producto:** añadir un objeto a `productos[]` con un `id` nuevo y
  poner la imagen en `public/img/`.
- **Reordenar:** cambiar `orden`. La categoría decide la sección y `orden`
  la posición dentro de ella.
- **Quitar demos, PDF o video:** `demos: []` o `""` en la URL; el botón
  desaparece solo.
- **Cambiar título de sección:** `site.json`.

## Qué se eliminó de `main`

- `src/pages/admin/`, `src/pages/api/`, `src/middleware.ts`,
  `src/lib/session.ts`
- `src/components/admin/`, `src/layouts/AdminLayout.astro`
- Los tokens `--color-admin-*` de `global.css`
- `src/db/`, `drizzle/`, `drizzle.config.ts`, `docker-compose.yml`,
  `.env.example`
- `scripts/seed.ts`, `scripts/update-image-paths.ts`
- Dependencias: `@astrojs/vercel`, `drizzle-orm`, `postgres`, `drizzle-kit`,
  `dotenv`

## Pasos manuales pendientes

1. **Vercel:** borrar las env vars `DATABASE_URL`, `ADMIN_PASSWORD` y
   `SESSION_SECRET`. Ya no se usan; dejarlas no rompe nada, pero se arrastran
   credenciales sin necesidad. Confirmar que el framework preset sea "Astro"
   y el output dir `dist`.
2. **Supabase:** pausar o borrar el proyecto cuando producción esté
   verificada.
3. **Repo nuevo para el admin:** si se quiere, ver los comandos arriba.

## Pendientes heredados del contenido

- ¿Incluir la tarjeta "Cast" ("Coming Soon") del sitio viejo?
- 5 productos (eRestaurant, Assistant, ERP, HUB, DAM) no tienen demos ni
  video.
- Los PDFs y videos apuntan con hotlink a `showroom.eroomsuite.com/wp-content`.
  Si ese WordPress se apaga, se rompen. Para evitarlo, copiarlos a `public/`
  o a un CDN.
- Fuente: `global.css` todavía nombra Aspekta en `--font-sans`, y
  `public/fonts/Aspekta-*` sigue en el repo, aunque un commit anterior dice
  "drop Aspekta font". Hay que revisar si se usa o limpiarla.

## Herramientas de desarrollo instaladas (nivel usuario, `~/.claude`)

Estas herramientas se cargan al abrir una sesión nueva de Claude Code.

- MCP `astro-docs` (https://mcp.docs.astro.build/mcp).
- `codebase-memory-mcp` v0.11: MCP más el skill `codebase-memory`, 3 agentes
  y hooks de Grep/Glob/Read.
- Skills: `astro` (astrolicious/agent-skills), `astro-expert`
  (oimiragieo/agent-studio) y `astro-sites-manager` (fabricioctelles/skills).
