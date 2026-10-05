import site from "./site.json";

/**
 * Textos de la home que no son parte de un producto — hoy, los dos títulos
 * de sección. Viven hardcodeados en `site.json`.
 *
 * Ojo: las keys están "cruzadas" a propósito — `hotelero` es el título de la
 * sección de herramientas para huéspedes y viceversa. Así estaba en la base
 * de datos original y así se respeta.
 */
export type SectionTitles = {
  hotelero: string;
  huesped: string;
};

export function getSectionTitles(): SectionTitles {
  return site.sectionTitles;
}
