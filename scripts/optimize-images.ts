/**
 * Convierte public/img/*.png a WebP (calidad 82, misma resolución). Las
 * cards son mockups fotográficos — no necesitan la compresión sin pérdida
 * de PNG — y hoy pesan hasta 2.2MB c/u (~20MB en total para 15 imágenes).
 *
 * No es idempotente a propósito: corre una vez, no borra los .png
 * originales (quedan como respaldo; borrarlos es un paso manual aparte
 * una vez confirmado que los .webp se ven bien).
 *
 * Uso: npx tsx scripts/optimize-images.ts
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMG_DIR = path.join(import.meta.dirname, "../public/img");

async function main() {
  const files = (await readdir(IMG_DIR)).filter((f) => f.toLowerCase().endsWith(".png"));
  if (files.length === 0) {
    console.log("No hay .png en public/img.");
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const inputPath = path.join(IMG_DIR, file);
    const outputPath = path.join(IMG_DIR, file.replace(/\.png$/i, ".webp"));

    const before = (await stat(inputPath)).size;
    await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);
    const after = (await stat(outputPath)).size;

    totalBefore += before;
    totalAfter += after;
    console.log(
      `${file} -> ${path.basename(outputPath)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${(
        (1 - after / before) *
        100
      ).toFixed(0)}% menos)`
    );
  }

  console.log(
    `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
