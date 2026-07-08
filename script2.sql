    -- ==========================================
    -- POLÍTICAS PARA LA TABLA "perfiles"
    -- ==========================================
  
    -- 1. Cualquiera (incluso visitantes) puede ver los perfiles (necesario para mostrar el nombre del autor)
    CREATE POLICY "Perfiles publicos para leer"
      ON public.perfiles FOR SELECT
      USING (true);
  
    -- 2. Un usuario solo puede modificar su propio perfil
    CREATE POLICY "Usuarios pueden actualizar su propio perfil"
      ON public.perfiles FOR UPDATE
      USING (auth.uid() = id);
  

    -- ==========================================
    -- POLÍTICAS PARA LA TABLA "articulos"
    -- ==========================================
  
    -- 1. Cualquiera puede leer los artículos
    CREATE POLICY "Artículos públicos para leer"
      ON public.articulos FOR SELECT
      USING (true);
  
    -- 2. Solo el dueño de la cuenta puede crear un artículo a su nombre
    CREATE POLICY "Usuarios pueden crear sus propios artículos"
      ON public.articulos FOR INSERT
      WITH CHECK (auth.uid() = autor_id);
  
    -- 3. Solo el autor original puede editar su artículo
    CREATE POLICY "Usuarios pueden actualizar sus propios artículos"
      ON public.articulos FOR UPDATE
      USING (auth.uid() = autor_id)
      WITH CHECK (auth.uid() = autor_id);
  
    -- 4. Solo el autor original puede eliminar su artículo
    CREATE POLICY "Usuarios pueden borrar sus propios artículos"
      ON public.articulos FOR DELETE
      USING (auth.uid() = autor_id);
