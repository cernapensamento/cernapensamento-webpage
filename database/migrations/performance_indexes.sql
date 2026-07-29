-- ==========================================
-- MIGRATION: PERFORMANCE INDEXES
-- ==========================================
-- Descripción: Índices B-Tree optimizados para las consultas principales (lecturas).
-- Objetivo: Evitar Seq Scans (Full Table Scans) en operaciones críticas.

-- 1. Indexar el estado y la fecha de creación de los artículos.
-- Uso: En la portada se buscan artículos "publicados" ordenados por fecha descendente.
CREATE INDEX IF NOT EXISTS idx_articulos_estado_creado ON public.articulos(estado, creado_en DESC);

-- 2. Indexar la clave foránea autor_id en artículos.
-- Uso: Cuando un usuario entra a la página de un autor, buscamos todos sus artículos.
CREATE INDEX IF NOT EXISTS idx_articulos_autor_id ON public.articulos(autor_id);

-- 3. Indexar la clave foránea articulo_id en comentarios.
-- Uso: Crítico. Al cargar un artículo, se buscan todos sus comentarios.
-- Sin este índice, la DB escaneará TODOS los comentarios de todos los artículos.
CREATE INDEX IF NOT EXISTS idx_comentarios_articulo_id ON public.comentarios(articulo_id);

-- 4. Indexar la clave foránea autor_id en comentarios.
-- Uso: Opcional, útil si en un futuro mostramos "Comentarios recientes de este usuario".
CREATE INDEX IF NOT EXISTS idx_comentarios_autor_id ON public.comentarios(autor_id);
