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

// Capas de blur apiladas para el efecto "glass" progresivo del overlay: cada
// una suma su blur solo a partir de cierto punto hacia abajo (via mask-image),
// de forma que el desenfoque se acumula desde el centro de la imagen hacia la
// base de la tarjeta (texto y botones), en vez de un backdrop-blur parejo en
// toda la superficie. 0% es el borde superior de la tarjeta, 100% el inferior.
const GLASS_BLUR_START_PCT = 45; // desde acá empieza a sumar blur (0px)
const GLASS_BLUR_END_PCT = 100; // al llegar acá alcanza el blur máximo
const GLASS_BLUR_MAX_PX = 64;
const GLASS_BLUR_STEPS = 8; // más pasos = transición más suave entre bandas

const glassLayers = Array.from({ length: GLASS_BLUR_STEPS }, (_, i) => {
  const span = GLASS_BLUR_END_PCT - GLASS_BLUR_START_PCT;
  const step = span / GLASS_BLUR_STEPS;
  const from = GLASS_BLUR_START_PCT + step * i;
  // Cada banda se solapa con la siguiente (feather) para que el aumento de
  // blur se sienta continuo en vez de a los saltos.
  const to = Math.min(from + step * 2, GLASS_BLUR_END_PCT);
  const blurPx = (GLASS_BLUR_MAX_PX / GLASS_BLUR_STEPS) * (i + 1);
  return { from, to, blurPx };
});

function glassMaskStyle(from: number, to: number): React.CSSProperties {
  const mask = `linear-gradient(to bottom, transparent ${from}%, black ${to}%)`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

// Cada capa/overlay controla su propia opacidad (en vez de heredarla de un
// padre común): backdrop-filter animado a través de la opacidad de un
// ancestro puede saltar en vez de transicionar suave en algunos navegadores.
const glassFadeClass = (active: boolean) =>
  `transition-opacity duration-500 ease-out ${active ? "opacity-100" : "pointer-events-none opacity-0"}`;

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
  // Con exactamente 2 demos se apilan full width en columna en vez de ir
  // lado a lado en una fila de 2 columnas.
  const demoRows = chunkInRows(product.demos, product.demos.length === 2 ? 1 : 2);

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

        {/* Overlay glass con demos / pdf / video / descripción. Cada capa
            controla su propia opacidad (ver glassFadeClass) en vez de
            heredarla de un padre común. */}
        {glassLayers.map(({ from, to, blurPx }, i) => (
          <div
            key={i}
            className={`absolute inset-0 ${glassFadeClass(active)}`}
            style={{
              backdropFilter: `blur(${blurPx}px) contrast(1.25) saturate(1.5)`,
              WebkitBackdropFilter: `blur(${blurPx}px) contrast(1.25) saturate(1.5)`,
              ...glassMaskStyle(from, to),
            }}
          />
        ))}
        <div className={`absolute inset-0 bg-[rgba(14,35,62,0.02)] ${glassFadeClass(active)}`} />

        <div className={`absolute inset-0 flex flex-col justify-between p-8 ${active ? "" : "pointer-events-none"}`}>
          {hasDemos && (
            // El blur propio de este pill tiene su propio fade (glassFadeClass) en vez
            // de heredar la opacidad del wrapper: un backdrop-filter dentro de un
            // ancestro cuya opacidad está animando puede saltar en vez de transicionar
            // suave (el mismo motivo por el que las capas de arriba se auto-manejan).
            <div
              className={`flex flex-col gap-0.5 rounded-pill-outer bg-white/45 p-1 ${glassFadeClass(active)}`}
              style={{
                backdropFilter: "blur(64px) saturate(1.15)",
                WebkitBackdropFilter: "blur(64px) saturate(1.15)",
              }}
            >
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
                      className={`flex h-[76px] items-center justify-center rounded-pill-inner px-5 text-center text-[20px] font-medium tracking-[-0.4px] text-ink transition-colors duration-200 hover:bg-white ${revealClass(
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
                    className="flex flex-1 items-center justify-center rounded-pill-inner px-5 py-3 text-center text-[18px] font-[450] tracking-[-0.4px] text-white transition-colors duration-200 hover:bg-white hover:text-link-active"
                  >
                    PDF Informativo
                  </a>
                )}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={openVideo}
                    className="flex flex-1 items-center justify-center rounded-pill-inner px-5 py-3 text-center text-[18px] font-[450] tracking-[-0.4px] text-white transition-colors duration-200 hover:bg-white hover:text-link-active"
                  >
                    Video Promocional
                  </button>
                )}
              </div>
            )}

            <p
              className={`w-full text-[16px] font-normal leading-[1.15] tracking-[-0.16px] text-white ${revealClass(active)}`}
              style={revealStyle(active, 160)}
            >
              {product.descripcion}
            </p>
          </div>
        </div>
      </div>

      <p className="text-[32px] font-medium leading-[1.15] tracking-[-0.72px] text-white">{product.titulo}</p>
    </div>
  );
}
