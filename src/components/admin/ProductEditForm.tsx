import { useState } from "react";
import type { Product, Demo } from "../../data/types";

type SaveState = "idle" | "saving" | "saved" | "error";

const inputClass =
  "w-full rounded-pill-inner border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40";

export default function ProductEditForm({ product }: { product: Product }) {
  const [titulo, setTitulo] = useState(product.titulo);
  const [descripcion, setDescripcion] = useState(product.descripcion);
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
        body: JSON.stringify({ titulo, descripcion, pdfUrl, videoUrl, demos }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-sm text-white">
        Título
        <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-2 text-sm text-white">
        Descripción
        <textarea
          className={inputClass}
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-white">
        PDF Informativo (URL)
        <input
          className={inputClass}
          type="url"
          placeholder="https://…"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-white">
        Video Promocional (URL)
        <input
          className={inputClass}
          type="url"
          placeholder="https://…"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white">Enlaces de demo ({demos.length})</p>
          <button
            type="button"
            onClick={addDemo}
            className="text-sm text-link-active"
          >
            + Agregar demo
          </button>
        </div>

        {demos.length === 0 && (
          <p className="text-sm text-footer-text">Sin demos — la tarjeta no mostrará ese grid.</p>
        )}

        {demos.map((demo, i) => (
          <div key={i} className="flex items-start gap-2 rounded-pill-inner border border-white/10 p-3">
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
              className="mt-1 shrink-0 text-sm text-red-400"
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
          className="rounded-pill-inner bg-white px-6 py-3 font-medium text-ink disabled:opacity-60"
        >
          {state === "saving" ? "Guardando…" : "Guardar cambios"}
        </button>
        {state === "saved" && <p className="text-sm text-green-400">Guardado ✓</p>}
        {state === "error" && <p className="text-sm text-red-400">Hubo un error al guardar.</p>}
      </div>
    </form>
  );
}
