/**
 * Actualiza `products.imagen` de .png a .webp contra la base ya sembrada
 * (Supabase u otra) — el seed (scripts/seed.ts) no vuelve a correr sobre una
 * base con datos, así que las filas existentes necesitan este UPDATE puntual
 * después de convertir las imágenes (scripts/optimize-images.ts).
 *
 * Reversible: correrlo con REVERT=1 vuelve a poner .png en vez de .webp.
 *
 * Uso: npx tsx scripts/update-image-paths.ts
 *      REVERT=1 npx tsx scripts/update-image-paths.ts
 */
import { eq, like } from "drizzle-orm";
import { db } from "../src/db/client";
import { products } from "../src/db/schema";

async function main() {
  const revert = process.env.REVERT === "1";
  const [from, to] = revert ? [".webp", ".png"] : [".png", ".webp"];

  const rows = await db.select().from(products).where(like(products.imagen, `%${from}`));
  if (rows.length === 0) {
    console.log(`No hay filas con imagen terminada en ${from}.`);
    return;
  }

  for (const row of rows) {
    const nuevaImagen = row.imagen.replace(new RegExp(`\\${from}$`), to);
    await db.update(products).set({ imagen: nuevaImagen }).where(eq(products.id, row.id));
    console.log(`${row.id}: ${row.imagen} -> ${nuevaImagen}`);
  }

  console.log(`\n${rows.length} filas actualizadas.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
