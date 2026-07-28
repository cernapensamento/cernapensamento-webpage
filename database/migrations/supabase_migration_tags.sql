-- Migración para añadir Tipos de Escrito y Etiquetas (Tags) con soporte i18n

-- 1. Modificación en la tabla de artículos para el Tipo de Escrito
-- Añadimos la columna si no existe. (Actualmente puede existir la columna `tipo` como texto, 
-- pero nos aseguramos de que haya consistencia o renombramos).
-- Asumimos que la columna actual se llama `tipo` y es de tipo texto.
-- Si queremos forzar los valores (opcional):
-- ALTER TABLE articulos ADD CONSTRAINT check_tipo CHECK (tipo IN ('artigo', 'ensaio', 'reportaxe', 'columna', 'entrevista', 'poesia'));

-- 2. Tabla para las Etiquetas (Agnóstica al idioma)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Traducciones de Etiquetas
CREATE TABLE IF NOT EXISTS tag_translations (
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  lang VARCHAR(2) NOT NULL, -- 'es' o 'gl'
  name VARCHAR NOT NULL,    -- Nombre localizado
  PRIMARY KEY (tag_id, lang)
);

-- 4. Tabla pivote (Relación Muchos a Muchos: Artículo <-> Etiquetas)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articulos(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Habilitar RLS (Row Level Security) para las nuevas tablas
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura (Públicas)
CREATE POLICY "Etiquetas visibles para todos" ON tags FOR SELECT USING (true);
CREATE POLICY "Traducciones de etiquetas visibles para todos" ON tag_translations FOR SELECT USING (true);
CREATE POLICY "Tags de artículos visibles para todos" ON article_tags FOR SELECT USING (true);

-- Políticas de escritura (Solo administradores / usuarios autenticados)
-- Asegúrate de ajustar esta regla según tu rol de administrador
CREATE POLICY "Editores pueden crear tags" ON tags FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editores pueden traducir tags" ON tag_translations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editores pueden asignar tags" ON article_tags FOR ALL USING (auth.role() = 'authenticated');

-- Opcional: Migrar temáticas existentes de la columna array a la nueva estructura.
-- (Este paso requiere una función en PL/pgSQL si se desea automatizar, pero puede dejarse 
-- para más adelante si las etiquetas actuales se recrearán manualmente).
