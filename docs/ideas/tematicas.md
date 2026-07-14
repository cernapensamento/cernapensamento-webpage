# Sistema de Temáticas (MVP con Array)

## Declaración del Problema
¿Cómo podríamos permitir a los autores categorizar sus artículos con temáticas solapables de forma rápida, para que en el futuro los lectores puedan descubrir contenido relacionado sin necesidad de una arquitectura de base de datos compleja?

## Dirección Recomendada
**PostgreSQL Arrays (Folksonomía Ligera):** Añadir una columna `tematicas` de tipo `text[]` (array de cadenas de texto) a la tabla `articulos`. 
En el editor (UI), los autores verán un campo de texto donde pueden escribir temáticas separadas por coma (ej. `economía, filosofía, tecnología`) que se guardarán directamente como un array. Es la forma más rápida de habilitar la funcionalidad de filtrado a futuro sin fricción técnica hoy.

## Suposiciones Clave a Validar
- [ ] **Suposición 1:** Los autores usarán la funcionalidad. *(Prueba: Ver el porcentaje de artículos nuevos que incluyen al menos una temática en el próximo mes).*
- [ ] **Suposición 2:** La falta de estandarización (ej. "Cripto" vs "Criptomonedas") no arruinará la experiencia inicial de filtrado. *(Prueba: Revisar manualmente las temáticas generadas en 3 semanas para evaluar el nivel de caos/fragmentación).*
- [ ] **Suposición 3:** La búsqueda/filtrado con arrays en PostgreSQL será lo suficientemente rápida para nuestra escala actual. *(Prueba: Monitorear el tiempo de carga al lanzar la página de "Explorar por Temática" en el futuro).*

## Alcance del MVP (Producto Mínimo Viable)
**Incluido:**
- Script SQL para añadir la columna `tematicas` (`text[]`) a la tabla `articulos`.
- Modificación del tipo de dato `ArticleData` en TypeScript para incluir `tematicas?: string[]`.
- Interfaz en `ArticleEditor.tsx` para ingresar temáticas (ej. un input de texto que separe por comas y las convierta en array visualmente).
- Guardado y carga de las temáticas desde Supabase.
- Visualización simple de las temáticas como *chips* (píldoras de texto) al final o inicio del artículo público.

**No Incluido (y por qué):**
- **Páginas dedicadas por temática:** No sabemos aún cuáles temáticas serán populares.
- **Auto-completado de base de datos:** Requiere indexar todas las temáticas existentes y crear un endpoint de búsqueda rápida. Se retrasa para la v2.
- **Tablas relacionales (`articulos_tematicas`):** Añade mucha fricción técnica innecesaria para validar si la gente realmente usará los tags.

## Preguntas Abiertas
- En la interfaz de lectura pública, ¿hacer clic en una temática debería llevar (por ahora) a un estado "En construcción", no hacer nada (solo visual), o hacer una búsqueda básica en la misma página principal?
