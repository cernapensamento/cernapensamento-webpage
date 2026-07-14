# Sistema de Borradores (Drafts)

## Declaración del Problema
¿Cómo podríamos permitir a los autores guardar artículos inacabados de forma segura e iterar en ellos, manteniéndolos ocultos del público sin salir de su flujo de trabajo principal?

## Dirección Recomendada
**Flujo Unificado y Estado Explícito:** El backend ya cuenta con una columna `estado` (borrador/publicado). La solución se enfocará 100% en la UX/UI:
1. En el Escritorio (`escritorio/page.tsx`), todos los artículos convivirán en la misma lista.
2. Los artículos no terminados tendrán un badge o etiqueta visual prominente de "BORRADOR".
3. En el editor, añadiremos la capacidad de "Despublicar" un artículo ya publicado, devolviéndolo al estado de borrador.

## Suposiciones Clave a Validar
- [ ] **Suposición 1:** Mezclar borradores y publicados en la misma lista no abrumará visualmente a los autores que tengan decenas de artículos. *(Prueba: Monitorear si los autores piden filtros o pestañas cuando acumulen mucho contenido).*
- [ ] **Suposición 2:** El guardado manual ("Guardar Borrador") no provocará pérdida de datos por descuidos del usuario. *(Prueba: Estar atentos a reportes de "perdí lo que escribí" para priorizar el autoguardado en la v2).*

## Alcance del MVP
**Incluido:**
- Renderizado unificado en `escritorio/page.tsx`: Mostrar borradores junto con publicados.
- Distinción visual: Badge dorado/gris de `BORRADOR` en la tarjeta del artículo en el Escritorio.
- Lógica de "Despublicar": Un botón en `ArticleEditor.tsx` (cuando se está editando un artículo publicado) que cambie el estado a `borrador`.
- Las consultas en la página pública principal (`src/app/page.tsx`) ya filtran por `estado = 'publicado'`, por lo que la privacidad ya está garantizada.

**No Incluido (y por qué):**
- **Autoguardado silencioso (Auto-save):** Complejidad técnica alta para sincronización en tiempo real. Se retrasa para una futura iteración.
- **Pestañas de "Solo Borradores" o "Solo Publicados":** Mantenemos la interfaz lo más plana y minimalista posible por ahora, delegándolo todo al badge visual.

## Preguntas Abiertas
- Si un artículo está en "borrador", ¿deberíamos permitir que el autor comparta una URL secreta para que alguien más lo lea antes de publicar? (Dejado para el futuro).
