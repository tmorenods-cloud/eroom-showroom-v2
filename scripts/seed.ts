/**
 * Carga src/data/products.json en la base de datos. Pensado para correr una
 * sola vez contra una base vacía (setup inicial / demo nueva). No es
 * idempotente a propósito: si ya hay productos, no vuelve a sembrar, para
 * no pisar ediciones hechas desde el admin. Para resetear todo, borrá las
 * tablas o la base y volvé a correr `npm run db:seed`.
 */
import { db } from "../src/db/client";
import { products, demos } from "../src/db/schema";
import raw from "../src/data/products.json" with { type: "json" };

async function main() {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) {
    console.log("La tabla products ya tiene datos — no se vuelve a sembrar.");
    return;
  }

  for (const p of raw.productos) {
    await db.insert(products).values({
      id: p.id,
      categoria: p.categoria,
      orden: p.orden,
      titulo: p.titulo,
      descripcion: p.descripcion,
      imagen: p.imagen,
      pdfUrl: p.pdfUrl,
      videoUrl: p.videoUrl,
    });

    for (let i = 0; i < p.demos.length; i++) {
      const demo = p.demos[i];
      await db.insert(demos).values({
        productId: p.id,
        label: demo.label,
        url: demo.url,
        orden: i,
      });
    }
  }

  console.log(`Sembrados ${raw.productos.length} productos.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
