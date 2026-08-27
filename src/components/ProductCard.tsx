import { useEffect, useRef, useState } from "react";
import type { Product } from "../data/types";

/**
 * ProductCard — isla interactiva (node 4005:191 / 4012:1299 en Figma).
 *
 * Reposo: solo la imagen del producto, sin overlay (fiel al estado "Default"
 * de eRoom Butler en el diseño). Al interactuar aparece el glass overlay con
 * el grid de demos, PDF/Video y la descripción, con fade-in + translateY.
 *
 * - Desktop (pointer con hover, >= 1200px): se activa con mouse enter/leave.
 * - Tablet/mobile (< 1200px): se activa con un tap; un tap fuera de la
 *   tarjeta la cierra. Aplica incluso en dispositivos táctiles que reportan
 *   soporte de hover (p. ej. un iPad con Magic Keyboard/trackpad), porque el
 *   diseño fija el corte en el mismo breakpoint que el resto de la UI (ver
 *   los botones btn-demo/btn-pdf/btn-video), no en la capacidad del puntero.
 */

// Combina capacidad de hover con el ancho de viewport (mismo breakpoint que
// btn-demo/btn-pdf/btn-video) y se re-evalúa en cambios de tamaño/rotación
// vía el listener de matchMedia, en vez de calcularse una sola vez al cargar.
function useHoverMode() {
  const [hoverMode, setHoverMode] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (min-width: 1200px)");
    const update = () => setHoverMode(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return hoverMode;
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
//
// Se probó bajar GLASS_BLUR_STEPS a 4 (compensando blur/contraste/saturación
// para que el resultado final en la base diera igual) para montar menos
// backdrop-filter por card — pero menos capas = menos escalones en el
// degradé, y aunque el valor final compuesto sea el mismo, se nota como un
// salto más brusco (sobre todo en contraste/saturación, más sensibles al ojo
// que el blur). Se volvió a 8 a pedido por eso. La optimización real de
// performance no dependía del número de capas sino de mostrarlas (ver
// showGlass más abajo).
const GLASS_BLUR_START_PCT = 45; // desde acá empieza a sumar blur (0px)
const GLASS_BLUR_END_PCT = 100; // al llegar acá alcanza el blur máximo
const GLASS_BLUR_MAX_PX = 64;
const GLASS_BLUR_STEPS = 8; // más pasos = transición más suave entre bandas
const GLASS_CONTRAST = 1.25;
const GLASS_SATURATE = 1.125;

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

// Debe coincidir con la duración de glassFadeClass/revealClass (duration-500)
// — ver el useEffect de showGlass más abajo.
const GLASS_TRANSITION_MS = 500;

// btn-pdf y btn-video comparten exactamente el mismo estilo (solo cambia el
// nombre de la clase raíz, usado como hook de estilos/analytics) — antes
// estaba repetido dos veces letra por letra.
const cardPillBtnClass = (variant: "btn-pdf" | "btn-video") =>
  `${variant} flex flex-1 items-center justify-center rounded-pill-inner px-5 py-3 text-center text-[length:var(--card-btn-size)] font-normal leading-[1.15] tracking-[-0.01em] bg-white text-link-active transition-colors duration-200 xl:font-[450] xl:tracking-[-0.4px] min-[1200px]:bg-transparent min-[1200px]:text-white min-[1200px]:hover:bg-white min-[1200px]:hover:text-link-active`;

export default function ProductCard({ product }: { product: Product }) {
  const [active, setActive] = useState(false);
  const hoverMode = useHoverMode();
  const rootRef = useRef<HTMLDivElement>(null);

  // Las capas de blur (glassLayers) solo se montan mientras la card está
  // activa o recién se desactivó — antes quedaban siempre en el DOM con
  // opacity:0, y backdrop-filter es de lo más caro de componer que hay en
  // CSS: con 15 cards en la grilla eso eran ~15×N capas pagando su costo
  // todo el tiempo, aunque casi siempre 0 o 1 card esté activa a la vez. El
  // timeout retrasa el desmontaje para no cortar el fade-out de 500ms a la
  // mitad (glassFadeClass/revealClass usan esa misma duración).
  const [showGlass, setShowGlass] = useState(false);
  useEffect(() => {
    if (active) {
      setShowGlass(true);
      return;
    }
    const timeout = setTimeout(() => setShowGlass(false), GLASS_TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [active]);

  useEffect(() => {
    if (hoverMode) return;
    function handleOutside(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [hoverMode]);

  // Si el modo cambia (resize/rotación cruza el breakpoint de 1200px),
  // arranca en estado cerrado en vez de arrastrar el `active` del modo
  // anterior (p. ej. una tarjeta que quedó abierta por tap en tablet no debe
  // seguir abierta al pasar a modo hover de desktop).
  useEffect(() => {
    setActive(false);
  }, [hoverMode]);

  const hasDemos = product.demos.length > 0;
  const hasPdf = Boolean(product.pdfUrl);
  const hasVideo = Boolean(product.videoUrl);
  // Con exactamente 2 demos se apilan full width en columna en vez de ir
  // lado a lado en una fila de 2 columnas.
  const demoRows = chunkInRows(product.demos, product.demos.length === 2 ? 1 : 2);

  function toggleOnTap() {
    if (!hoverMode) setActive((a) => !a);
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
      onMouseEnter={() => hoverMode && setActive(true)}
      onMouseLeave={() => hoverMode && setActive(false)}
      onClick={toggleOnTap}
      className="product-card group flex w-full flex-col items-start gap-1 outline-none"
      data-product-id={product.id}
    >
      <div className="product-card-media relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-card">
        <img
          src={product.imagen}
          alt={product.titulo}
          loading="lazy"
          decoding="async"
          className="product-card-image absolute inset-0 h-full w-full object-cover"
        />

        {/* Capa que oscurece la imagen al interactuar */}
        <div
          className="product-card-shade absolute inset-0 transition-opacity duration-500 ease-out"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgb(61 83 126 / 0) 0%, var(--color-card-shade-via) 48.077%, var(--color-card-shade) 100%)",
            opacity: active ? 1 : 0,
          }}
        />

        {/* Overlay glass con demos / pdf / video / descripción. Cada capa
            controla su propia opacidad (ver glassFadeClass) en vez de
            heredarla de un padre común. Solo se monta mientras hace falta
            (ver showGlass más arriba) — el resto del tiempo esta card no
            paga el costo de sus backdrop-filter. */}
        {showGlass && glassLayers.map(({ from, to, blurPx }, i) => (
          <div
            key={i}
            className={`product-card-glass-layer absolute inset-0 ${glassFadeClass(active)}`}
            style={{
              backdropFilter: `blur(${blurPx}px) contrast(${GLASS_CONTRAST}) saturate(${GLASS_SATURATE})`,
              WebkitBackdropFilter: `blur(${blurPx}px) contrast(${GLASS_CONTRAST}) saturate(${GLASS_SATURATE})`,
              ...glassMaskStyle(from, to),
            }}
          />
        ))}
        <div className={`product-card-glass-tint absolute inset-0 bg-[rgba(14,35,62,0.02)] ${glassFadeClass(active)}`} />

        <div
          className={`product-card-content absolute inset-0 flex flex-col justify-between p-[var(--card-pad)] ${active ? "" : "pointer-events-none"}`}
        >
          {hasDemos && (
            // El blur propio de este pill tiene su propio fade (glassFadeClass) en vez
            // de heredar la opacidad del wrapper: un backdrop-filter dentro de un
            // ancestro cuya opacidad está animando puede saltar en vez de transicionar
            // suave (el mismo motivo por el que las capas de arriba se auto-manejan).
            <div
              className={`product-card-demos flex flex-col gap-0.5 rounded-pill-outer bg-white/45 p-1 ${glassFadeClass(active)}`}
              style={{
                backdropFilter: "blur(64px) saturate(1.15)",
                WebkitBackdropFilter: "blur(64px) saturate(1.15)",
              }}
            >
              {demoRows.map((row, i) => (
                // A partir de tablet y mobile (< xl) siempre en columna: solo
                // desde `xl` (desktop) se recuperan las 2 columnas cuando la
                // fila tiene 2 demos.
                <div
                  key={i}
                  className={`product-card-demo-row grid grid-cols-1 gap-0.5 ${row.length === 2 ? "xl:grid-cols-2" : ""}`}
                >
                  {row.map((demo, j) => (
                    <a
                      key={demo.url}
                      href={demo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`btn-demo flex h-auto items-center justify-center rounded-pill-inner px-[1em] py-[var(--btn-demo-pad-y)] text-center text-[length:var(--card-demo-size)] font-medium tracking-[-0.4px] text-ink transition-colors duration-200 sm:px-5 bg-white min-[1200px]:bg-transparent min-[1200px]:hover:bg-white ${revealClass(
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

          <div className={`product-card-footer flex w-full flex-col items-start gap-5 ${!hasDemos ? "mt-auto" : ""}`}>
            {(hasPdf || hasVideo) && (
              <div
                className={`product-card-actions flex w-full items-center gap-0.5 rounded-pill-outer bg-white/38 p-1 ${revealClass(active)}`}
                style={revealStyle(active, 120)}
              >
                {hasPdf && (
                  <a
                    href={product.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cardPillBtnClass("btn-pdf")}
                  >
                    PDF Informativo
                  </a>
                )}
                {hasVideo && (
                  <button
                    type="button"
                    onClick={openVideo}
                    className={cardPillBtnClass("btn-video")}
                  >
                    Video Promocional
                  </button>
                )}
              </div>
            )}

            <p
              className={`product-card-description w-full text-[length:var(--card-desc-size)] font-normal leading-[1.15] tracking-[-0.01em] text-white xl:tracking-[-0.16px] ${revealClass(
                active
              )}`}
              style={revealStyle(active, 160)}
            >
              {product.descripcion}
            </p>
          </div>
        </div>
      </div>

      <p className="product-card-title text-[length:var(--card-title-size)] font-medium leading-[1.15] tracking-[-0.72px] text-white">
        {product.titulo}
      </p>
    </div>
  );
}
