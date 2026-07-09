# Tareas: Fase 2 - Componentización

## Phase 2.1: Foundation - El Shell del Escritorio
- [x] **Task 1: Extraer Layout de Escritorio**
  - **Descripción**: Crear `src/app/escritorio/layout.tsx` y aislar la barra lateral, la navegación superior y el menú inferior móvil.
  - **Criterios de Aceptación**:
    - [x] `SideNavBar.tsx`, `DashboardTopBar.tsx`, `MobileBottomNav.tsx` existen.
    - [x] `escritorio/page.tsx`, `nuevo/page.tsx` y `perfil/page.tsx` reducen drásticamente su tamaño borrando las duplicidades.
  - **Archivos tocados**: `src/app/escritorio/layout.tsx`, páginas hijas, `src/components/escritorio/*`.
  - **Estimación**: L (Large)

## Phase 2.2: Navegación y Footer Público
- [x] **Task 2: Componentes Comunes Públicos**
  - **Descripción**: Unificar el `<nav>` y el `<footer>` de `page.tsx` y del slug del artículo.
  - **Criterios de Aceptación**:
    - [x] `PublicNavBar.tsx` reemplaza al nav embebido.
    - [x] `SiteFooter.tsx` soporta las 3 variantes (`full`, `compact`, `minimal`).
  - **Archivos tocados**: `src/components/PublicNavBar.tsx`, `src/components/SiteFooter.tsx`, `src/app/page.tsx`, `src/app/articulo/[slug]/page.tsx`.
  - **Estimación**: M (Medium)

## Checkpoint: Layouts Estructurales
- [x] Navegación funciona en todo el portal.
- [x] Tests de Playwright Pasan.
- [x] Build exitoso.

## Phase 2.3: Centralización de Utilidades (DRY)
- [x] **Task 3: Utilidades de Sesión y DB**
  - **Descripción**: Extraer la carga de usuario (`getAuthenticatedUser`) y la lógica de registro de correos (`subscribeEmail`) a utilidades reusables.
  - **Criterios de Aceptación**:
    - [x] `src/utils/auth.ts` expone `getAuthenticatedUser()`.
    - [x] `src/utils/subscribe.ts` expone `subscribeEmail()`. (Nota: Suscripción por email no aplica en modelo de Gated Community).
    - [x] Componentes y páginas viejos refactorizados.
  - **Estimación**: S (Small)

- [x] **Task 4: Constantes Base**
  - **Descripción**: Aislar urls de avatares por defecto, el nombre del portal, etc.
  - **Criterios de Aceptación**:
    - [x] `src/lib/constants.ts` existe y se usa en toda la aplicación.
  - **Estimación**: XS (Extra Small)

## Phase 2.4: Componentización Granular
- [x] **Task 5: Refactor Visual Interno**
  - **Descripción**: Aislar pedazos visuales de las páginas.
  - **Criterios de Aceptación**:
    - [x] Creados: `FeaturedArticleHero`, `ArticleCard`, `StatCard`, `DraftItem`, `QuoteBox`.
  - **Estimación**: M (Medium)

- [x] **Task 6: Consolidación y Limpieza**
  - **Descripción**: Cambiar tags incorrectos de HTML nativo a componentes optimizados de Next.
  - **Criterios de Aceptación**:
    - [x] Todos los enlaces de ruteo usan `<Link href="...">`.
    - [x] Imágenes usan el componente `<Image>` en vez de `<img>`.
    - [x] Metadata de título arreglada a `El Dialecto`. (Ahora usa Cerna).
  - **Estimación**: S (Small)

## Checkpoint: Complete
- [x] E2E funcionan.
- [x] 0 duplicaciones a nivel de UI grande.
