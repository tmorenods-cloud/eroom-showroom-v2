# eRoom Suite — Showroom

Onepage **estática** del showroom de eRoom Suite (Astro + React islands +
Tailwind v4). No hay base de datos ni panel admin: el contenido está
hardcodeado en archivos JSON dentro del repo y se publica con cada build.

> El proyecto anterior (con panel `/admin` + Postgres/Supabase) vive en la
> rama `admin-supabase`. Ver [docs/HANDOFF.md](docs/HANDOFF.md).

## Stack

- **Astro 5** (`output: "static"`) + **React** para las islas interactivas
  (`ProductCard`, `VideoModal`).
- **Tailwind CSS v4**: tokens de diseño en `src/styles/global.css`.
- **Contenido**: `src/data/products.json` (tarjetas) y `src/data/site.json`
  (títulos de sección). Son la única fuente de verdad.

## Desarrollo local

Necesitás Node 20+.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + build → dist/
npm run preview   # sirve dist/ localmente
```

No hacen falta variables de entorno.

## Cómo editar contenido

1. Editá el JSON correspondiente:
   - **Tarjetas** (título, descripción, imagen, demos, PDF, video, orden,
     categoría): `src/data/products.json` → array `productos`.
   - **Títulos de sección**: `src/data/site.json`.
2. Imágenes nuevas: copiarlas a `public/img/` y referenciarlas como
   `/img/archivo.webp`. Para convertir PNG → WebP: `npm run img:optimize`.
3. `npm run build`: si el JSON tiene un error (categoría inválida, falta un
   campo, id duplicado), el build falla y dice qué producto lo causa.
4. Commit + push a `main` → Vercel reconstruye y publica.

Formato de un producto en [docs/HANDOFF.md](docs/HANDOFF.md#formato-de-los-datos).

## Deploy

Vercel detecta Astro y publica `dist/` como sitio estático; no necesita
adapter ni variables de entorno. Sirve igual en cualquier hosting estático
(Netlify, Cloudflare Pages, Nginx, S3…).

## Estructura

```
src/
  components/        Header, Footer, SectionTitle (Astro)
                     ProductCard, VideoModal (React islands)
  data/              products.json, site.json (contenido)
                     products.ts, settings.ts (lectura + validación)
                     types.ts
  layouts/           BaseLayout.astro
  pages/index.astro  onepage pública (se genera en build)
  styles/global.css  design tokens (Tailwind v4 @theme)
public/              img/, svg/, fonts/
scripts/             optimize-images.ts
docs/                HANDOFF.md, mapa-nombres.md
```
