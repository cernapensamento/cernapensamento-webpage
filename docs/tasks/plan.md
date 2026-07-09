# Implementation Plan: Fase 2 - Componentización y Modularización

## Overview
Esta fase se centra en eliminar la deuda técnica visual y de estructura del proyecto. Actualmente existe una alta duplicación de código (~250 líneas por página) en las interfaces del dashboard del escritorio y de la zona pública. Crearemos layouts compartidos, extraeremos componentes reutilizables y unificaremos utilidades en el backend (auth, suscripciones) para hacer el código mantenible y robusto.

## Architecture Decisions
- **Layouts anidados (App Router):** En lugar de duplicar el "shell" del dashboard (sidebar, navbar superior y navegación móvil), aprovecharemos `escritorio/layout.tsx` como Server Component para inyectar este cascarón de forma compartida.
- **Componentes modulares de UI:** La página principal y el dashboard quedarán como simples "orquestadores" de componentes (tarjetas, estadísticas, modales) purgados de diseño embebido.
- **Utilidades DRY:** Centralizar el chequeo de `getAuthenticatedUser()` y la lógica de `subscribeEmail()` para evitar repetir consultas a Supabase y reducir errores lógicos.

## Task List

### Phase 2.1: Foundation - El Shell del Escritorio
- [ ] Task 1: Crear `escritorio/layout.tsx` y los componentes base (`SideNavBar`, `DashboardTopBar`, `MobileBottomNav`). Refactorizar `escritorio/page.tsx`, `nuevo/page.tsx` y `perfil/page.tsx` para delegar el "shell" a este layout.

### Phase 2.2: Navegación y Footer Público
- [ ] Task 2: Extraer `PublicNavBar` y `SiteFooter`. Implementarlos en la homepage (`page.tsx`) y en la página de lectura (`articulo/[slug]/page.tsx`), asegurando las 3 variantes del footer (full, compact, minimal).

### Checkpoint: Layouts Estructurales
- [ ] La navegación funciona correctamente en el frontend y en el escritorio.
- [ ] Los tests de Playwright siguen pasando limpios.
- [ ] `npm run build` sin errores.

### Phase 2.3: Centralización de Utilidades (DRY)
- [ ] Task 3: Crear `src/utils/auth.ts` y `src/utils/subscribe.ts`. Refactorizar los formularios de suscripción y comprobaciones de sesión en las páginas para que consuman estas funciones.
- [ ] Task 4: Crear `src/lib/constants.ts` para agrupar variables de entorno estáticas como URLs por defecto, nombres de branding, etc.

### Phase 2.4: Componentización Granular
- [ ] Task 5: Componentizar elementos de la portada (`FeaturedArticleHero`, `ArticleCard`) y del dashboard (`StatCard`, `DraftItem`, `QuoteBox`).
- [ ] Task 6: Limpieza final de inconsistencias (uso estricto de `<Link>` e `<Image>`, metadata correcta).

### Checkpoint: Complete
- [ ] Todos los componentes funcionan modularmente.
- [ ] Ninguna página contiene más de 150 líneas de código estructural.
- [ ] Las métricas de Lighthouse y Web Vitals están estables o mejores.
- [ ] Listo para revisión.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Problemas de hidratación o contexto de cliente en el nuevo Layout | Alto | Mantener los marcadores `"use client"` estrictamente en las hojas del árbol (`nuevo/page.tsx`) y usar Server Components para los layouts siempre que sea posible. |
| Romper el flujo de creación de posts al mover botones de acción | Medio | Usar eventos o validaciones cruzadas si un botón del layout (`Publicar`) debe afectar a un estado de un hijo (`Editor`). |
