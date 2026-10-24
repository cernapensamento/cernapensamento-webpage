# Database & Storage Codemap — Cerna Pensamento

**Última actualización:** 2026-09-17  
**Puntos de entrada:** `database/schema_global_actualizado.sql`, `src/lib/supabase/`

---

## 1. Esquema Relacional de Base de Datos (PostgreSQL en Supabase)

```mermaid
erDiagram
    perfiles ||--o{ articulos : "escribe (autor_id)"
    perfiles ||--o{ comentarios : "publica (usuario_id)"
    articulos ||--o{ comentarios : "recibe (articulo_id)"
    articulos ||--o{ article_tags : "asigna"
    tags ||--o{ article_tags : "clasifica"
    tags ||--o{ tag_translations : "traduce"

    perfiles {
        uuid id PK
        text nombre
        text bio
        text avatar_url
        text rol
        boolean preferencia_boletin
        timestamp creado_en
    }

    articulos {
        uuid id PK
        text titulo_gl
        text titulo_es
        text subtitulo_gl
        text subtitulo_es
        text slug UNIQUE
        text contenido_gl
        text contenido_es
        text imagen_url
        text estado
        text tipo
        boolean fijado
        uuid autor_id FK
        timestamp creado_en
    }

    tags {
        uuid id PK
        text slug UNIQUE
    }

    tag_translations {
        uuid id PK
        uuid tag_id FK
        text lang
        text name
    }

    comentarios {
        uuid id PK
        uuid articulo_id FK
        uuid usuario_id FK
        text contenido
        timestamp creado_en
    }
```

> Valores permitidos: `perfiles.rol` (`usuario`, `escritor`, `admin`, `invitado`); `articulos.estado` (`borrador`, `en_revision`, `publicado`); `articulos.tipo` (`artigo`, `ensaio`, `reportaxe`, `columna`, `entrevista`, `poesia`); `tag_translations.lang` (`gl`, `es`).

---

## 2. Roles y Matriz de Permisos

| Rol | Permisos en `articulos` | Permisos en `perfiles` | Permisos en `comentarios` |
|---|---|---|---|
| `usuario` | Solo lectura (`SELECT`) de artículos `publicado`. | Lectura de todos, edición de su propio perfil. | Crear, editar y borrar sus propios comentarios. |
| `escritor` | Crear, editar y listar sus propios borradores y publicaciones. | Lectura de todos, edición de su propio perfil. | Comentar en cualquier artículo. |
| `invitado` | Escritura limitada (máximo 4 artículos totales y 2 anuales). | Edición de su propio perfil. | Comentar en cualquier artículo. |
| `admin` | Control total (`SELECT`, `UPDATE`, `DELETE`, fijar en portada). | Modificación de roles y administración de perfiles. | Moderación global (eliminar comentarios). |

---

## 3. Seguridad a Nivel de Fila (Row Level Security - RLS)

Todas las tablas operan con RLS activo:
- **`articulos`**:
  ```sql
  -- Lectura pública solo de artículos publicados
  CREATE POLICY "Articulos publicos visibles para todos" 
  ON articulos FOR SELECT 
  USING (estado = 'publicado');

  -- Los autores pueden gestionar sus propios artículos
  CREATE POLICY "Autores gestionan sus articulos" 
  ON articulos FOR ALL 
  USING (auth.uid() = autor_id);
  ```
- **`perfiles`**:
  - Lectura pública para mostrar nombres y biografías de los autores.
  - Actualización restringida exclusivamente a `auth.uid() = id`.
- **`comentarios`**:
  - Inserción restringida a usuarios autenticados con `auth.uid() = usuario_id`.

---

## 4. Almacenamiento (Supabase Storage: `media`)

Se utiliza el bucket público centralizado canónico (`media`, con soporte legado para `imagenes-articulos`) gestionado mediante el módulo `src/lib/storage/`:

### Estructura Canónica de Directorios:
- **`profiles/{userId}/avatar-{timestamp}-{slug}.webp`**: Avatares de usuario y columnistas (redimensionados a máx 512×512, compresión WebP 85%).
- **`publications/covers/{userId}/cover-{timestamp}-{slug}.webp`**: Portadas de artículos (máx 1600×1200, WebP 82%).
- **`publications/inline/{userId}/figure-{timestamp}-{slug}.webp`**: Imágenes incrustadas dentro del contenido (máx 1400×1400, WebP 82%).
- *Compatibilidad histórica:* Las rutas legacy (`avatares/`, `portadas/`, `contenido/`) siguen siendo reconocidas por `extractStoragePathFromUrl` para limpieza y desvinculación.

### Políticas RLS en `storage.objects`:
- **`SELECT`**: Lectura pública para cualquier visitante.
- **`INSERT` (Perfiles)**: Usuarios autenticados únicamente en su propia carpeta `profiles/{auth.uid()}/*`.
- **`INSERT` (Publicaciones)**: Redactores (`guest`, `member`, `founder`, `admin`, `escritor`) en `publications/*`.
- **`DELETE` / `UPDATE`**: Los usuarios pueden eliminar sus propios archivos; los roles `founder` y `admin` pueden gestionar y limpiar cualquier archivo del bucket.
- **Limpieza Automática (Garbage Collection)**:
  - Al reemplazar un avatar o portada, el archivo previo se elimina automáticamente.
  - Al guardar un artículo, las imágenes inline removidas del editor se eliminan del storage.
  - Al eliminar un artículo completo en el escritorio, su portada e imágenes incrustadas se purgan vía `cleanupPublicationImages()`.
