import { asc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { products as productsTable, demos as demosTable } from "../db/schema";
import type { Product, Categoria, Demo } from "./types";

/**
 * Capa de acceso a datos del showroom. Este es el único módulo que debería
 * cambiar si alguna vez se reemplaza Postgres/Drizzle por otra cosa — el
 * resto de la app (páginas públicas y admin) solo conoce estas funciones.
 */

type ProductRow = typeof productsTable.$inferSelect;
type DemoRow = typeof demosTable.$inferSelect;

function toProduct(row: ProductRow, demoRows: DemoRow[]): Product {
  return {
    id: row.id,
    categoria: row.categoria as Categoria,
    orden: row.orden,
    titulo: row.titulo,
    descripcion: row.descripcion,
    imagen: row.imagen,
    pdfUrl: row.pdfUrl,
    videoUrl: row.videoUrl,
    demos: demoRows.map((d) => ({ label: d.label, url: d.url })),
  };
}

/**
 * Trae productos (+ sus demos) en 2 queries siempre, sin importar cuántos
 * productos haya: 1 para products, 1 para TODOS sus demos con un solo
 * `WHERE product_id IN (...)`. La alternativa obvia — un query de demos por
 * producto (N+1) — es la que tenía esto antes, y contra un Postgres remoto
 * (Supabase) cada round-trip de red se paga aparte: con 15 productos eran
 * ~17 queries secuenciales y varios segundos de carga por request.
 */
async function fetchProductsWithDemos(where?: SQL): Promise<Product[]> {
  const rows = where
    ? await db.select().from(productsTable).where(where).orderBy(asc(productsTable.orden))
    : await db.select().from(productsTable).orderBy(asc(productsTable.orden));

  if (rows.length === 0) return [];

  const demoRows = await db
    .select()
    .from(demosTable)
    .where(
      inArray(
        demosTable.productId,
        rows.map((r) => r.id)
      )
    )
    .orderBy(asc(demosTable.orden));

  const demosByProduct = new Map<string, DemoRow[]>();
  for (const demo of demoRows) {
    const list = demosByProduct.get(demo.productId) ?? [];
    list.push(demo);
    demosByProduct.set(demo.productId, list);
  }

  return rows.map((row) => toProduct(row, demosByProduct.get(row.id) ?? []));
}

export async function getProductsByCategoria(categoria: Categoria): Promise<Product[]> {
  return fetchProductsWithDemos(eq(productsTable.categoria, categoria));
}

/** Trae los 15 productos de una — usar esto en vez de dos llamadas a
 * getProductsByCategoria cuando se necesitan ambas categorías (ej. la home
 * y el dashboard del admin), para no duplicar queries. */
export async function getAllProducts(): Promise<Product[]> {
  return fetchProductsWithDemos();
}

// Reusa fetchProductsWithDemos (mismo camino de 2 queries) en vez de repetir
// la lógica de armar el Product a mano — antes duplicaba el select + join de
// demos que ya hace la función de arriba.
export async function getProductById(id: string): Promise<Product | null> {
  const [product] = await fetchProductsWithDemos(eq(productsTable.id, id));
  return product ?? null;
}

export type ProductUpdateInput = {
  titulo: string;
  descripcion: string;
  pdfUrl: string;
  videoUrl: string;
  categoria: Categoria;
  orden: number;
  imagen: string;
  demos: Demo[];
};

export async function updateProduct(id: string, data: ProductUpdateInput): Promise<void> {
  await db
    .update(productsTable)
    .set({
      titulo: data.titulo,
      descripcion: data.descripcion,
      pdfUrl: data.pdfUrl,
      videoUrl: data.videoUrl,
      categoria: data.categoria,
      orden: data.orden,
      imagen: data.imagen,
    })
    .where(eq(productsTable.id, id));

  // Reemplazo completo de los demos: más simple que diffear altas/bajas/
  // reordenamientos, y el volumen por tarjeta es chico (0-4 filas).
  await db.delete(demosTable).where(eq(demosTable.productId, id));
  const validDemos = data.demos.filter((d) => d.label.trim() && d.url.trim());
  if (validDemos.length > 0) {
    await db.insert(demosTable).values(
      validDemos.map((d, i) => ({ productId: id, label: d.label.trim(), url: d.url.trim(), orden: i }))
    );
  }
}
