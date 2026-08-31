-- RLS ya está habilitado en products/demos (activado manualmente en el
-- dashboard de Supabase). Sin políticas, RLS bloquea todo acceso para
-- cualquier rol que no sea el que usa DATABASE_URL (bypassea RLS por ser
-- superuser/owner) — o sea, hoy no cambia nada para la app.
--
-- Esta política agrega lectura pública explícita (útil si en el futuro se
-- consulta esta data vía supabase-js/PostgREST con la key anon, ej. desde
-- el browser). No hay política de insert/update/delete a propósito: los
-- writes solo los hace el servidor (rutas /api/admin, protegidas por sesión),
-- nunca un rol anon/authenticated.

create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (true);

create policy "demos_public_read"
  on demos for select
  to anon, authenticated
  using (true);
