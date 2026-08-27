import { useEffect, useState } from "react";

/**
 * VideoModal — única instancia montada una vez en la página (ver index.astro).
 * Las ProductCard no manejan su propio modal: disparan el evento
 * "eroom:open-video" y este componente lo escucha y se encarga de mostrarlo.
 * Evita compartir estado entre islas de React independientes.
 */

type Detail = { url: string; title: string };

const isDirectVideoFile = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

export default function VideoModal() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    function onOpen(e: Event) {
      const custom = e as CustomEvent<Detail>;
      setVideoError(false);
      setDetail(custom.detail);
    }
    window.addEventListener("eroom:open-video", onOpen);
    return () => window.removeEventListener("eroom:open-video", onOpen);
  }, []);

  useEffect(() => {
    if (!detail) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDetail(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [detail]);

  if (!detail) return null;

  return (
    <div
      id="video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={() => setDetail(null)}
      role="dialog"
      aria-modal="true"
      aria-label={detail.title}
    >
      <div
        id="video-modal"
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-card bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="video-modal-close-btn"
          type="button"
          onClick={() => setDetail(null)}
          aria-label="Cerrar video"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl leading-none text-white hover:bg-white/25"
        >
          ×
        </button>

        {videoError ? (
          // El video es un .mp4 alojado en un host externo (WordPress) —
          // ver src/data/products.json. Si esa URL cae, cambia o el host
          // bloquea el hotlink, esto evita dejar el modal en blanco/girando
          // sin explicación (y evita el error de red suelto en consola).
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-white/80">
            No se pudo cargar el video. Probá de nuevo más tarde.
          </div>
        ) : isDirectVideoFile(detail.url) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            id="video-modal-player"
            src={detail.url}
            controls
            autoPlay
            preload="metadata"
            onError={() => setVideoError(true)}
            className="h-full w-full"
          />
        ) : (
          <iframe
            id="video-modal-iframe"
            src={detail.url}
            title={detail.title}
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
