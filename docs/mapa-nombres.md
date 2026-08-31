# Mapa de nombres nemotécnicos

Cada botón/contenedor clave del showroom público tiene ahora un `id` (elementos
únicos en la página) o una `class` (elementos que se repiten, como las
ProductCard) para ubicarlo fácil en el inspector del navegador o buscándolo en
el código (`grep -rn "nombre" src/`).

## Header — [Header.astro](../src/components/Header.astro)
| Nombre | Elemento |
|---|---|
| `#site-header` | `<header>` completo |
| `.header-logo` | logo eRoom Suite |
| `.header-contact-link` | link "Contacto" |
| `.header-contact-icon` | ícono del link de contacto |

## Sección de producto — [SectionTitle.astro](../src/components/SectionTitle.astro), [index.astro](../src/pages/index.astro)
| Nombre | Elemento |
|---|---|
| `#main-content` | `<main>` de la home |
| `#section-hoteleros` | sección "Herramientas para huéspedes" (productos categoría `hotelero`) |
| `#section-huespedes` | sección "Herramientas para hoteleros" (productos categoría `huesped`) |
| `.product-grid` | grilla de tarjetas (una por sección) |
| `.section-title` | título `<h2>` de cada sección |

## Tarjeta de producto — [ProductCard.tsx](../src/components/ProductCard.tsx)
Se repite una vez por producto, por eso son `class` y no `id` (también existe
`data-product-id` con el id del producto para identificar la instancia exacta).

| Nombre | Elemento |
|---|---|
| `.product-card` | raíz de la tarjeta |
| `.product-card-media` | contenedor de la imagen (aspect-ratio) |
| `.product-card-image` | `<img>` del producto |
| `.product-card-shade` | capa de oscurecido al hacer hover/tap |
| `.product-card-glass-layer` | cada banda de blur del efecto glass |
| `.product-card-glass-tint` | tinte final sobre el glass |
| `.product-card-content` | overlay con demos/pdf/video/descripción |
| `.product-card-demos` | píldora con los links de demos |
| `.product-card-demo-row` | fila dentro de la píldora de demos |
| `.btn-demo` | botón/link individual de demo |
| `.product-card-footer` | wrapper de acciones + descripción |
| `.product-card-actions` | píldora con PDF + Video |
| `.btn-pdf` | botón "PDF Informativo" |
| `.btn-video` | botón "Video Promocional" |
| `.product-card-description` | texto descriptivo |
| `.product-card-title` | título debajo de la tarjeta |

## Modal de video — [VideoModal.tsx](../src/components/VideoModal.tsx)
Instancia única montada una vez en la página, por eso son `id`.

| Nombre | Elemento |
|---|---|
| `#video-modal-backdrop` | fondo oscuro que cierra el modal al hacer click |
| `#video-modal` | caja del modal |
| `#video-modal-close-btn` | botón "×" de cerrar |
| `#video-modal-player` | `<video>` (cuando la URL es un archivo directo) |
| `#video-modal-iframe` | `<iframe>` (cuando la URL es de un embed) |

## Footer — [Footer.astro](../src/components/Footer.astro)
| Nombre | Elemento |
|---|---|
| `#site-footer` | `<footer>` completo |
| `.footer-mobile` | versión mobile (< sm) |
| `.footer-wordmark` | wordmark eRoom Suite (mobile) |
| `.footer-tagline` | "Upgrade your guest experience" |
| `.footer-social-list` | contenedor de íconos sociales |
| `.footer-social-link` | link social individual (+ `.footer-social-instagram`, `.footer-social-linkedin`, `.footer-social-youtube`) |
| `.footer-email-link` | link de email |
| `.footer-legal-mobile` | texto legal (mobile) |
| `.footer-desktop` | versión tablet/desktop (>= sm) |
| `.footer-desktop-row` | fila superior (links legales + copy) |
| `.footer-links-list` | contenedor de links legales |
| `.footer-link` | link legal individual |
| `.footer-legal-desktop` | texto legal (desktop) |
| `.footer-jacidi-link` | link a Jacidi.com |
| `.footer-wordmark-desktop` | wordmark eRoom Suite (desktop) |

## Notas
- Ningún nombre pisa clases de Tailwind existentes: se agregan como clase
  extra al principio del `className`/`class`, no reemplazan estilos.
- Los `id` son únicos por página (`site-header`, `site-footer`,
  `video-modal*`, `main-content`, `section-*`) — no reutilizar en otro
  componente que se repita.
- Para componentes que se repiten (ProductCard), usar siempre `class`, nunca
  `id`.
