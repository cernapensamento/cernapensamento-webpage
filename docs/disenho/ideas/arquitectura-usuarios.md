# Arquitectura de Usuarios: "El Club Exclusivo"

## El Problema
¿Cómo podríamos diseñar un modelo de usuarios extremadamente simple y unificado que agrupe a lectores, escritores y administradores en una sola entidad, facilitando la gestión del administrador sin fragmentar la base de datos?

## Dirección Recomendada: Registro Duro (Gated Community)
Eliminaremos por completo el concepto de "suscriptores anónimos". La plataforma adoptará una postura firme: para recibir el newsletter o interactuar con el contenido (en el futuro), el usuario debe registrarse explícitamente y tener una cuenta en la base de datos. 

Toda la estructura de usuarios se unificará bajo la tabla `perfiles`, conectada de forma nativa a Supabase Auth. Añadiremos un booleano `recibir_newsletter` a esta tabla. Esto simplifica radicalmente la base de datos, reduce los flujos de código que debemos mantener y prepara a cada usuario registrado para evolucionar naturalmente hacia roles como comentarista o escritor en un futuro.

## Asunciones Clave a Validar
- [ ] **Asumimos que el contenido justifica la fricción:** Creemos que la propuesta de valor de Cerna es lo bastante fuerte como para que los usuarios creen una cuenta (email + contraseña) solo para suscribirse. *Cómo validarlo: Medir cuántas visitas al formulario de "Suscríbete" terminan en una cuenta creada tras 2 semanas.*
- [ ] **Asumimos que los usuarios entienden el valor a largo plazo:** Creemos que los usuarios no verán el registro como un estorbo si les comunicamos que esto les permitirá comentar y escribir después. *Cómo validarlo: Entrevistar a los primeros 10 usuarios que se registren.*

## Alcance del MVP (Mínimo Producto Viable)
**Qué entra:**
1. Eliminar la tabla `suscriptores` y el archivo `script4.sql`.
2. Añadir la columna `recibir_newsletter (BOOLEAN DEFAULT TRUE)` a la tabla `perfiles`.
3. Eliminar los componentes de "Suscribirse" (como `FooterSubscribeForm` y `SubscribeButton`) o redirigirlos a `/login` con un mensaje claro.
4. Añadir una casilla en el `/escritorio/perfil` para que los usuarios puedan activar/desactivar la recepción del newsletter.

## Lo que NO vamos a hacer (Y por qué)
- **NO vamos a soportar Magic Links o Passwordless login ahora mismo.** Motivo: Añade complejidad a la configuración del servidor de correos, rompiendo nuestro objetivo de mantener el diseño técnico lo más simple posible.
- **NO mantendremos dos tablas.** Motivo: Queremos un panel de administración unificado donde un lector pueda ser promovido a escritor cambiando un simple selector.
- **NO enviaremos correos reales todavía.** Motivo: El MVP solo recoge la *intención* de recibir el newsletter (`recibir_newsletter = true`). La integración con un servicio de mailing (Resend/Mailchimp) queda fuera del scope inmediato.

## Preguntas Abiertas
- Si un usuario elimina su cuenta desde el dashboard, ¿debemos purgar en cascada sus artículos publicados o los mantenemos con un seudónimo "Usuario Eliminado"?
