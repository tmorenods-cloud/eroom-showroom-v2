import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { products as productsTable, demos as demosTable } from "../db/schema";
import type { Product, Categoria, Demo } from "./types";

/**
 * Capa de acceso a datos del showroom. Este es el único módulo que debería
 * cambiar si alguna vez se reemplaza Postgres/Drizzle por otra cosa — el
 * resto de la app (páginas públicas y admin) solo conoce estas funciones.
 */

function toProduct(row: typeof productsTable.$inferSelect, demoRows: (typeof demosTable.$inferSelect)[]): Product {
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

async function getDemosFor(productId: string) {
  return db.select().from(demosTable).where(eq(demosTable.productId, productId)).orderBy(asc(demosTable.orden));
}

export async function getProductsByCategoria(categoria: Categoria): Promise<Product[]> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.categoria, categoria))
    .orderBy(asc(productsTable.orden));

  const result: Product[] = [];
  for (const row of rows) {
    result.push(toProduct(row, await getDemosFor(row.id)));
  }
  return result;
}

export async function getAllProducts(): Promise<Product[]> {
  const [hoteleros, huespedes] = await Promise.all([
    getProductsByCategoria("hotelero"),
    getProductsByCategoria("huesped"),
  ]);
  return [...hoteleros, ...huespedes];
}

export async function getProductById(id: string): Promise<Product | null> {
  const rows = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (rows.length === 0) return null;
  return toProduct(rows[0], await getDemosFor(id));
}

export type ProductUpdateInput = {
  titulo: string;
  descripcion: string;
  pdfUrl: string;
  videoUrl: string;
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
