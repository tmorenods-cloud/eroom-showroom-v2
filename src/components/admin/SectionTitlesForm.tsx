import { useState } from "react";
import type { SectionTitles } from "../../data/settings";

type SaveState = "idle" | "saving" | "saved" | "error";

const inputClass =
  "w-full rounded-pill-inner border border-admin-border bg-admin-surface-2 px-4 py-3 text-admin-text outline-none transition-colors focus:border-link-active";
const labelClass = "flex flex-col gap-2 text-sm text-admin-text-muted";

/**
 * Los dos títulos de sección de la home ("Herramientas para…") — separado
 * de ProductEditForm porque no edita un producto sino `site_settings`, vía
 * /api/admin/settings en vez de /api/admin/productos/:id.
 */
export default function SectionTitlesForm({ titles }: { titles: SectionTitles }) {
  const [hotelero, setHotelero] = useState(titles.hotelero);
  const [huesped, setHuesped] = useState(titles.huesped);
  const [state, setState] = useState<SaveState>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("saving");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelero, huesped }),
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-admin-panel border border-admin-border bg-admin-surface p-5"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-admin-text-faint">
        Títulos de sección de la home
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Sección de productos "hotelero"
          <input
            className={inputClass}
            value={hotelero}
            onChange={(e) => setHotelero(e.target.value)}
            required
          />
        </label>

        <label className={labelClass}>
          Sección de productos "huésped"
          <input
            className={inputClass}
            value={huesped}
            onChange={(e) => setHuesped(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={state === "saving"}
          className="rounded-pill-inner bg-link-active px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "saving" ? "Guardando…" : "Guardar títulos"}
        </button>
        {state === "saved" && <p className="text-sm text-admin-success">Guardado ✓</p>}
        {state === "error" && <p className="text-sm text-admin-danger">Hubo un error al guardar.</p>}
      </div>
    </form>
  );
}
