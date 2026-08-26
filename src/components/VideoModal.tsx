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

  useEffect(() => {
    function onOpen(e: Event) {
      const custom = e as CustomEvent<Detail>;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={() => setDetail(null)}
      role="dialog"
      aria-modal="true"
      aria-label={detail.title}
    >
      <div
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-card bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setDetail(null)}
          aria-label="Cerrar video"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl leading-none text-white hover:bg-white/25"
        >
          ×
        </button>

        {isDirectVideoFile(detail.url) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={detail.url} controls autoPlay className="h-full w-full" />
        ) : (
          <iframe
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
