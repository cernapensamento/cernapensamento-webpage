# Frontend Codemap — Cerna Pensamento

**Última actualización:** 2026-09-17  
**Puntos de entrada:** `src/app/[lang]/layout.tsx`, `src/app/globals.css`

---

## 1. Arquitectura del Layout y Componentes

El frontend está estructurado sobre **Next.js 16 App Router** con React 19 y Server Components por defecto.

```
html (lang="gl|es")
└── body.min-h-screen.flex.flex-col
    └── ThemeProvider (next-themes)
        ├── HeaderVisibilityWrapper (Oculta nav en /escritorio y /login)
        │   └── PublicNavBar (sticky top-0 z-50, Logo, Links, Idioma, Tema, SideMenu)
        ├── main.flex-grow.flex.flex-col.relative
        │   └── Suspense (fallback=<Loading /> con fixed inset-0 z-40)
        │       └── {children} (Página activa)
        └── FooterVisibilityWrapper (Oculta footer en /escritorio)
            └── SiteFooter (Créditos, Enlaces canónicos, SocialLinks)
```

### Principios de Navegación y Transición
- **Barra de navegación persistente**: `PublicNavBar` se ubica en el `RootLayout`, fuera del límite de `Suspense`. Permanece anclada durante las transiciones de ruta sin parpadeos ni desmontajes.
- **Overlay de Carga de Pantalla Completa**: `src/app/[lang]/loading.tsx` utiliza `fixed inset-0 z-40 bg-parchment`. Esto cubre el contenido previo y el footer evitando saltos visuales (*layout shifts*), mientras la barra superior (`z-50`) permanece visible e interactiva.
- **Visibilidad Contextual**: Los componentes `HeaderVisibilityWrapper` y `FooterVisibilityWrapper` escuchan `usePathname()` para ocultar la cabecera/pie público en rutas administrativas (`/escritorio`) o de autenticación (`/login`).

---

## 2. Sistema de Diseño y Tokens CSS

La interfaz utiliza **Tailwind CSS v4** configurado con variables CSS semánticas que conmutan automáticamente entre modo claro y oscuro (`.dark`).

| Variable CSS | Modo Claro | Modo Oscuro | Propósito |
|---|---|---|---|
| `--color-parchment` / `bg-parchment` | `#fbf9f8` | `#141414` | Fondo principal de página tipo papel editorial |
| `--color-surface` / `bg-surface` | `#f4f0ec` | `#1a1a1a` | Superficie de tarjetas y barra de navegación |
| `--color-charcoal` / `text-charcoal` | `#1a1a1a` | `#e4e2e2` | Color tipográfico principal de alto contraste |
| `--color-gold` / `text-gold` | `#c5a059` | `#d4af37` | Acento editorial para etiquetas y enlaces activos |
| `--color-lines` / `border-lines` | `#e5dfd8` | `#2a2a2a` | Separadores y bordes sutiles |

### Tipografía
- **Serif (Titulares y Citas)**: `Libre Caslon Text` (`--font-libre-caslon`, variable de Google Fonts).
- **Sans (Lectura, Botones, UI)**: `Source Sans 3` (`--font-source-sans`, variable de Google Fonts).
- **Iconografía**: Google Material Symbols Outlined cargado dinámicamente en el `<head>`.

---

## 3. Catálogo de Módulos Frontend

### Layout (`src/components/layout/`)
| Componente | Tipo | Responsabilidad |
|---|---|---|
| `PublicNavBar.tsx` | Client | Barra de navegación superior con selector de idioma, cambio de tema, botón de vuelta y apertura del menú lateral. |
| `SideMenu.tsx` | Client | Menú desplegable lateral (*drawer*) con navegación temática, institucional y redes. |
| `SiteFooter.tsx` | Server | Pie de página con copyright, créditos, enlaces institucionales y redes. |
| `HeaderVisibilityWrapper.tsx` | Client | Condicional de renderizado para `PublicNavBar`. |
| `FooterVisibilityWrapper.tsx` | Client | Condicional de renderizado para `SiteFooter`. |

### Secciones de Portada (`src/components/sections/`)
| Componente | Responsabilidad |
|---|---|
| `FeaturedArticleHero.tsx` | Artículo destacado principal con imagen de cabecera y tipografía destacada. |
| `PinnedArticlesPanel.tsx` | Cuadrícula de artículos fijados por los administradores. |
| `ColumnistsSection.tsx` | Carrusel/cuadrícula de autores y columnistas con fotos y enlaces de contacto. |
| `ThemesSection.tsx` | Explorador de categorías y temáticas clave. |
| `AboutUsSection.tsx` | Manifiesto y propósito de Cerna Pensamento. |
| `ContactSection.tsx` | Sección de llamada a la acción con enlace directo al formulario institucional de contacto. |

### Componentes de Funcionalidad (`src/components/features/`)
| Componente | Responsabilidad |
|---|---|
| `ArticleCard.tsx` | Tarjeta de previsualización de artículo con autor, fecha, etiqueta y extracto. |
| `ArticlesFilterBar.tsx` | Barra interactiva de filtros por temática con actualización de URL query params. |
| `CommentsSection.tsx` | Sistema de comentarios anidados con soporte para autores autenticados y sanitización. |
| `ProfileDashboard.tsx` | Panel de edición de perfil para escritores (biografía, redes, preferencias). |

### UI Reutilizable (`src/components/ui/`)
- `SocialLinks.tsx`: Lista accesible de redes sociales unificada (LinkedIn, Instagram, X/Twitter, Correo).
- `ThemeToggle.tsx`: Interruptor accesible claro/oscuro.
- `LanguageToggle.tsx`: Conmutador de localización Gallego/Castellano conservando la ruta actual.
- `EstatutosMarkdownRenderer.tsx` / `MarkdownRenderer.tsx`: Procesadores seguros de Markdown institucional.

---

## 4. Internacionalización (i18n)

- **Idiomas soportados**: Gallego (`gl`, por defecto) y Castellano (`es`).
- **Resolución en Servidor**: `getDictionary(lang)` carga `src/dictionaries/{gl,es}.json` de forma asíncrona.
- **Resolución en Cliente**: `useLocale()` y `getDictionaryClient(lang)`.
- **Detección**: `src/proxy.ts` inspecciona cabeceras `Accept-Language` y cookies para redirigir si no hay prefijo de idioma en la URL.
