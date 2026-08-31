import type { APIRoute } from "astro";
import { updateSectionTitles } from "../../../data/settings";

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.hotelero !== "string" || typeof body.huesped !== "string") {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const hotelero = body.hotelero.trim();
  const huesped = body.huesped.trim();
  if (!hotelero || !huesped) {
    return new Response(JSON.stringify({ error: "Los títulos no pueden estar vacíos" }), { status: 400 });
  }

  await updateSectionTitles({ hotelero, huesped });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
