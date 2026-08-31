CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
-- Tabla nueva → RLS se habilita acá mismo (a diferencia de products/demos,
-- donde se activó a mano en el dashboard de Supabase antes de que existiera
-- esta migración). El rol de DATABASE_URL es owner/superuser y bypassea RLS
-- igual, así que esto no cambia nada para la app hoy — solo deja lectura
-- pública explícita para el día que se consulte vía supabase-js/PostgREST
-- con la key anon. Sin política de insert/update/delete a propósito: los
-- writes solo los hace el servidor (rutas /api/admin, protegidas por sesión).
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "site_settings_public_read"
  ON "site_settings" FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint
-- Semilla: los dos títulos de sección, con el texto ya cruzado que quedó
-- después del swap manual en index.astro — esta migración es lo que los
-- vuelve editables, no un cambio de contenido.
INSERT INTO "site_settings" ("key", "value") VALUES
  ('section_title_hotelero', 'Herramientas para huéspedes'),
  ('section_title_huesped', 'Herramientas para hoteleros')
ON CONFLICT ("key") DO NOTHING;
