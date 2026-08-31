import { useState } from "react";
import type { Categoria, Demo, Product } from "../../data/types";

type SaveState = "idle" | "saving" | "saved" | "error";

const categoriaLabel: Record<Categoria, string> = {
  hotelero: "Huésped",
  huesped: "Hotelero",
};

const inputClass =
  "w-full rounded-pill-inner border border-admin-border bg-admin-surface-2 px-4 py-3 text-admin-text outline-none transition-colors focus:border-link-active";
const labelClass = "flex flex-col gap-2 text-sm text-admin-text-muted";
const sectionClass = "flex flex-col gap-5 rounded-admin-panel border border-admin-border bg-admin-surface p-5";

export default function ProductEditForm({ product }: { product: Product }) {
  const [titulo, setTitulo] = useState(product.titulo);
  const [descripcion, setDescripcion] = useState(product.descripcion);
  const [categoria, setCategoria] = useState<Categoria>(product.categoria);
  const [orden, setOrden] = useState(product.orden);
  const [imagen, setImagen] = useState(product.imagen);
  const [imagenBroken, setImagenBroken] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(product.pdfUrl);
  const [videoUrl, setVideoUrl] = useState(product.videoUrl);
  const [demos, setDemos] = useState<Demo[]>(product.demos.length > 0 ? product.demos : []);
  const [state, setState] = useState<SaveState>("idle");

  function updateDemo(index: number, field: keyof Demo, value: string) {
    setDemos((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addDemo() {
    setDemos((rows) => [...rows, { label: "", url: "" }]);
  }

  function removeDemo(index: number) {
    setDemos((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("saving");
    try {
      const res = await fetch(`/api/admin/productos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, categoria, orden, imagen, pdfUrl, videoUrl, demos }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Identidad: imagen + título/categoría/orden juntos, para reconocer la
          tarjeta de un vistazo igual que en el listado del panel. */}
      <div className={sectionClass}>
        <div className="flex gap-4">
          <div className="aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-pill-inner border border-admin-border bg-admin-surface-2">
            {imagen && !imagenBroken ? (
              <img
                src={imagen}
                alt={titulo}
                className="h-full w-full object-cover"
                onError={() => setImagenBroken(true)}
                onLoad={() => setImagenBroken(false)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-admin-text-faint">
                {imagen ? "No carga" : "Sin imagen"}
              </div>
            )}
          </div>

          <label className={`${labelClass} flex-1`}>
            Imagen (ruta o URL)
            <input
              className={inputClass}
              type="text"
              placeholder="/img/producto.webp o https://…"
              value={imagen}
              onChange={(e) => {
                setImagen(e.target.value);
                setImagenBroken(false);
              }}
            />
          </label>
        </div>

        <label className={labelClass}>
          Título
          <input
            className={inputClass}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Categoría
            <select
              className={inputClass}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
            >
              {(Object.keys(categoriaLabel) as Categoria[]).map((c) => (
                <option key={c} value={c}>
                  {categoriaLabel[c]}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Orden
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              value={orden}
              onChange={(e) => setOrden(Math.max(0, Number(e.target.value) || 0))}
              required
            />
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <label className={labelClass}>
          Descripción
          <textarea
            className={inputClass}
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>

        <label className={labelClass}>
          PDF Informativo (URL)
          <input
            className={inputClass}
            type="url"
            placeholder="https://…"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
          />
        </label>

        <label className={labelClass}>
          Video Promocional (URL)
          <input
            className={inputClass}
            type="url"
            placeholder="https://…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </label>
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-admin-text">Enlaces de demo ({demos.length})</p>
          <button type="button" onClick={addDemo} className="text-sm text-link-active">
            + Agregar demo
          </button>
        </div>

        {demos.length === 0 && (
          <p className="text-sm text-admin-text-faint">Sin demos — la tarjeta no mostrará ese grid.</p>
        )}

        {demos.map((demo, i) => (
          <div key={i} className="flex items-start gap-2 rounded-pill-inner border border-admin-border p-3">
            <div className="flex flex-1 flex-col gap-2">
              <input
                className={inputClass}
                placeholder="Etiqueta (ej. Demo Butler)"
                value={demo.label}
                onChange={(e) => updateDemo(i, "label", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="https://…"
                value={demo.url}
                onChange={(e) => updateDemo(i, "url", e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeDemo(i)}
              aria-label="Quitar demo"
              className="mt-1 shrink-0 text-sm text-admin-danger"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={state === "saving"}
          className="rounded-pill-inner bg-link-active px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "saving" ? "Guardando…" : "Guardar cambios"}
        </button>
        {state === "saved" && <p className="text-sm text-admin-success">Guardado ✓</p>}
        {state === "error" && <p className="text-sm text-admin-danger">Hubo un error al guardar.</p>}
      </div>
    </form>
  );
}
