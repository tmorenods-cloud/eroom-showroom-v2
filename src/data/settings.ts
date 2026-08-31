import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { siteSettings } from "../db/schema";

/**
 * Textos editables de la home que no son parte de un producto — hoy, los
 * dos títulos de sección. Cada uno vive en `site_settings` bajo estas keys
 * fijas (ver drizzle/0001_boring_may_parker.sql para la semilla inicial).
 */
export const SECTION_TITLE_KEYS = {
  hotelero: "section_title_hotelero",
  huesped: "section_title_huesped",
} as const;

export type SectionTitles = {
  hotelero: string;
  huesped: string;
};

// Fallback si por lo que sea la tabla está vacía (ej. ambiente nuevo sin
// seedear) — así la home nunca se queda sin título en vez de romper.
const DEFAULT_TITLES: SectionTitles = {
  hotelero: "Herramientas para huéspedes",
  huesped: "Herramientas para hoteleros",
};

export async function getSectionTitles(): Promise<SectionTitles> {
  const rows = await db.select().from(siteSettings);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return {
    hotelero: byKey.get(SECTION_TITLE_KEYS.hotelero) ?? DEFAULT_TITLES.hotelero,
    huesped: byKey.get(SECTION_TITLE_KEYS.huesped) ?? DEFAULT_TITLES.huesped,
  };
}

export async function updateSectionTitles(titles: SectionTitles): Promise<void> {
  // Upsert por fila — `excluded.value` toma el valor que se intentó
  // insertar, así cada key se actualiza al suyo en un solo round-trip.
  await db
    .insert(siteSettings)
    .values([
      { key: SECTION_TITLE_KEYS.hotelero, value: titles.hotelero },
      { key: SECTION_TITLE_KEYS.huesped, value: titles.huesped },
    ])
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: sql`excluded.value` },
    });
}
