# Arquitectura Base de Datos: "Clean Slate Unificado"

## El Problema
¿Cómo podríamos consolidar toda la inicialización de la base de datos en un solo archivo limpio que sincronice los datos de autenticación (como el correo) sin comprometer la seguridad pública de esos datos?

## Dirección Recomendada: Esquema Unificado + Trigger Sincronizado
Eliminaremos la maraña de scripts aislados y crearemos un único archivo central y definitivo: `schema.sql`.

En este esquema, la tabla `perfiles` incluirá una columna `email`. Utilizaremos el trigger nativo de Postgres vinculado a `auth.users` para que, cuando alguien se registre, su email se copie automáticamente a su perfil. **Sin embargo, aplicaremos políticas RLS estrictas (o una vista pública)** para evitar que cualquier visitante que lea un artículo pueda inspeccionar la base de datos y extraer los emails privados de todos los autores/usuarios.

## Asunciones Clave a Validar
- [ ] **Asumimos que el admin necesita leer correos rápidamente:** Creemos que la principal razón para poner el email en la tabla pública es para consultarlo en queries simples o un dashboard de admin sin cruzar joins complejos con `auth.users`.
- [ ] **Asumimos que no hay datos en producción:** Creemos que actualmente la base de datos de Supabase está en fase de desarrollo y podemos ejecutar un borrado total (Drop) sin perder usuarios reales.

## Alcance del MVP (Mínimo Producto Viable)
**Qué entra:**
1. Crear un único `schema.sql`.
2. Incluir los `DROP TABLE IF EXISTS` al inicio del script para limpiar todo rastro anterior.
3. Definir `perfiles` con: `id`, `nombre`, `bio`, `avatar_url`, `email` (TEXT), `rol`, `recibir_newsletter`.
4. Definir `articulos` con: `id`, `slug`, `titulo`, `contenido`, `imagen_url`, `estado`, `creado_en`, `actualizado_en`, `autor_id`.
5. Recrear el bucket `imagenes-articulos`.
6. Actualizar el trigger `handle_new_user()` para que lea `NEW.email` e inserte la fila completa.
7. Implementar la seguridad para aislar el email público del privado (sea por tabla paralela de configuraciones o vistas SQL de solo lectura).

## Lo que NO vamos a hacer (Y por qué)
- **NO mantendremos un historial de scripts SQL.** Motivo: Hasta que no salgamos a producción con datos reales, mantener migraciones incrementales solo causa confusión. `schema.sql` será nuestra única fuente de verdad.
- **NO usaremos la tabla para cambiar el correo del login.** Motivo: La columna `email` en `perfiles` será *read-only* (solo lectura desde auth). Si el usuario quiere cambiar su email, deberá usar un flujo oficial de Supabase Auth, el cual disparará el trigger para actualizar la tabla.

## Preguntas Abiertas
- La RLS actual permite que la tabla `perfiles` sea pública para ver el nombre del autor. Poner el `email` ahí lo expondría. (Se necesita resolver en implementación si usamos Vista SQL vs. Tabla Paralela).
