import type { APIRoute } from "astro";
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../../../lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = form.get("password");

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return new Response("ADMIN_PASSWORD no está configurada en el servidor.", { status: 500 });
  }

  if (typeof password !== "string" || password !== adminPassword) {
    return redirect("/admin/login?error=1");
  }

  cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(), SESSION_COOKIE_OPTIONS);
  return redirect("/admin");
};
