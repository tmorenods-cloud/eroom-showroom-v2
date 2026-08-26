import type { APIRoute } from "astro";
import { getProductById, updateProduct } from "../../../../data/products";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "id requerido" }), { status: 400 });
  }

  const existing = await getProductById(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "Producto no encontrado" }), { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.titulo !== "string" || !Array.isArray(body.demos)) {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const demos = body.demos
    .filter((d: unknown): d is { label: unknown; url: unknown } => typeof d === "object" && d !== null)
    .map((d: { label: unknown; url: unknown }) => ({
      label: typeof d.label === "string" ? d.label : "",
      url: typeof d.url === "string" ? d.url : "",
    }));

  await updateProduct(id, {
    titulo: body.titulo,
    descripcion: typeof body.descripcion === "string" ? body.descripcion : "",
    pdfUrl: typeof body.pdfUrl === "string" ? body.pdfUrl : "",
    videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : "",
    demos,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
