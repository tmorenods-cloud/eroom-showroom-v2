import data from "./products.json";
import type { Product, Categoria } from "./types";

/**
 * Capa de acceso a datos del showroom. El contenido vive hardcodeado en
 * `products.json` (versionado en git) y se lee en build — no hay base de
 * datos. Para cambiar una tarjeta: editar el JSON, commit + push, y Vercel
 * reconstruye el sitio. Ver docs/HANDOFF.md.
 */

const CATEGORIAS: readonly Categoria[] = ["hotelero", "huesped"];

// El JSON se edita a mano, así que se valida acá: un error en el JSON rompe
// el build (con un mensaje que dice qué producto falla) en vez de publicar
// una tarjeta rota.
function validate(raw: (typeof data.productos)[number]): Product {
  const fail = (msg: string) => {
    throw new Error(`products.json → producto "${raw.id ?? "?"}": ${msg}`);
  };
  if (!raw.id) fail("falta id");
  if (!CATEGORIAS.includes(raw.categoria as Categoria)) {
    fail(`categoria "${raw.categoria}" inválida (usar ${CATEGORIAS.join(" o ")})`);
  }
  if (typeof raw.orden !== "number") fail("orden debe ser un número");
  if (!raw.titulo) fail("falta titulo");
  if (!raw.imagen) fail("falta imagen");
  for (const d of raw.demos) {
    if (!d.label || !d.url) fail("cada demo necesita label y url");
  }
  return { ...raw, categoria: raw.categoria as Categoria };
}

const productos: Product[] = data.productos.map(validate).sort((a, b) => a.orden - b.orden);

const ids = new Set<string>();
for (const p of productos) {
  if (ids.has(p.id)) throw new Error(`products.json: id duplicado "${p.id}"`);
  ids.add(p.id);
}

export function getAllProducts(): Product[] {
  return productos;
}

export function getProductsByCategoria(categoria: Categoria): Product[] {
  return productos.filter((p) => p.categoria === categoria);
}
