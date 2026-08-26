import raw from "./products.json";
import type { Product, Categoria } from "./types";

/**
 * Fuente de contenido del showroom. Hoy es un JSON estático — cuando se
 * conecte el panel admin, este módulo es el único punto que debería cambiar
 * para leer de un backend en vez del archivo local.
 */
const products = raw.productos as Product[];

export function getProductsByCategoria(categoria: Categoria): Product[] {
  return products.filter((p) => p.categoria === categoria).sort((a, b) => a.orden - b.orden);
}

export default products;
