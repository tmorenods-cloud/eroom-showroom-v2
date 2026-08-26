import { useEffect, useRef, useState } from "react";
import type { Product } from "../data/types";

/**
 * ProductCard — isla interactiva (node 4005:191 / 4012:1299 en Figma).
 *
 * Reposo: solo la imagen del producto, sin overlay (fiel al estado "Default"
 * de eRoom Butler en el diseño). Al interactuar aparece el glass overlay con
 * el grid de demos, PDF/Video y la descripción, con fade-in + translateY.
 *
 * - Desktop (pointer con hover): se activa con mouse enter/leave.
 * - Táctil (tablet/mobile): se activa con un tap; un tap fuera de la tarjeta
 *   la cierra.
 */

let hoverCapable: boolean | null = null;
function supportsHover() {
  if (hoverCapable === null) {
    hoverCapable = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  }
  return hoverCapable;
}

function chunkInRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

// Nota: el delay se aplica vía `style` (transitionDelay), no como clase de
// Tailwind — un valor arbitrario interpolado en runtime no es detectable por
// el escaneo estático de Tailwind y no generaría el CSS correspondiente.
const revealClass = (active: boolean) =>
  `transition-all duration-500 ease-out ${active ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-2 opacity-0"}`;

const revealStyle = (active: boolean, delayMs: number): React.CSSProperties => ({
  transitionDelay: active ? `${delayMs}ms` : "0ms",
});

export default function ProductCard({ product }: { product: Product }) {
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (supportsHover()) return;
    function handleOutside(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  const hasDemos = product.demos.length > 0;
  const hasPdf = Boolean(product.pdfUrl);
  const hasVideo = Boolean(product.videoUrl);
  const demoRows = chunkInRows(product.demos, 2);

  function toggleOnTap() {
    if (!supportsHover()) setActive((a) => !a);
  }

  function openVideo(e: React.SyntheticEvent) {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("eroom:open-video", { detail: { url: product.videoUrl, title: product.titulo } })
    );
  }

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => supportsHover() && setActive(true)}
      onMouseLeave={() => supportsHover() && setActive(false)}
      onClick={toggleOnTap}
      className="group flex w-full flex-col items-start gap-1 outline-none"
      data-product-id={product.id}
    >
      <div className="relative h-[450px] w-full cursor-pointer overflow-hidden rounded-card">
        <img
          src={product.imagen}
          alt={product.titulo}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Capa que oscurece la imagen al interactuar */}
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-out"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgb(61 83 126 / 0) 0%, var(--color-card-shade-via) 48.077%, var(--color-card-shade) 100%)",
            opacity: active ? 1 : 0,
          }}
        />

        {/* Overlay glass con demos / pdf / video / descripción */}
        <div
          className={`absolute inset-0 flex flex-col justify-between p-8 backdrop-blur-3xl transition-[opacity,background-color] duration-500 ease-out ${
            active ? "bg-[rgba(14,35,62,0.02)] opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {hasDemos && (
            <div className="flex flex-col gap-0.5 rounded-pill-outer bg-white/45 p-1 backdrop-blur-3xl">
              {demoRows.map((row, i) => (
                <div
                  key={i}
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: row.length === 2 ? "1fr 1fr" : "1fr" }}
                >
                  {row.map((demo, j) => (
                    <a
                      key={demo.url}
                      href={demo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`flex h-[76px] items-center justify-center rounded-pill-inner px-5 text-center text-[20px] font-medium tracking-[-0.4px] text-ink ${revealClass(
                        active
                      )}`}
                      style={revealStyle(active, (i * row.length + j) * 40)}
                    >
                      {demo.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className={`flex w-full flex-col items-start gap-5 ${!hasDemos ? "mt-auto" : ""}`}>
            {(hasPdf || hasVideo) && (
              <div
                className={`flex w-full items-center gap-0.5 rounded-pill-outer bg-white/38 p-1 ${revealClass(active)}`}
                style={revealStyle(active, 120)}
              >
                {hasPdf && (
                  <a
                    href={product.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-1 items-center justify-center rounded-pill-inner px-5 py-3 text-center text-[20px] font-medium tracking-[-0.4px] text-white"
                  >
                    PDF Informativo
                  </a>
                )}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={openVideo}
                    className="flex flex-1 items-center justify-center rounded-pill-inner bg-white px-5 py-3 text-center text-[20px] font-medium tracking-[-0.4px] text-link-active"
                  >
                    Video Promocional
                  </button>
                )}
              </div>
            )}

            <p
              className={`w-full text-[16px] leading-[1.15] tracking-[-0.16px] text-white ${revealClass(active)}`}
              style={revealStyle(active, 160)}
            >
              {product.descripcion}
            </p>
          </div>
        </div>
      </div>

      <p className="text-[36px] font-medium leading-[1.15] tracking-[-0.72px] text-white">{product.titulo}</p>
    </div>
  );
}
