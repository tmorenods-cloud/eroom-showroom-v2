import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

/**
 * Un producto del showroom (una tarjeta). Espejo de `src/data/types.ts`
 * pero como tabla — es la fuente de verdad en producción; `products.json`
 * queda solo como semilla inicial (ver scripts/seed.ts).
 */
export const products = pgTable("products", {
  id: text("id").primaryKey(), // slug, ej. "butler"
  categoria: text("categoria").notNull(), // "hotelero" | "huesped"
  orden: integer("orden").notNull(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion").notNull().default(""),
  imagen: text("imagen").notNull(),
  pdfUrl: text("pdf_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
});

/**
 * Enlaces del grid "demo" de una tarjeta — cardinalidad variable (0 a 4+)
 * por producto, por eso es tabla aparte y no columnas fijas.
 */
export const demos = pgTable("demos", {
  id: serial("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  orden: integer("orden").notNull().default(0),
});

/**
 * Textos editables sueltos de la home que no pertenecen a ningún producto
 * (hoy: los dos títulos de sección). Key/value en vez de columnas fijas para
 * poder sumar otro texto editable a futuro sin migración nueva.
 */
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
