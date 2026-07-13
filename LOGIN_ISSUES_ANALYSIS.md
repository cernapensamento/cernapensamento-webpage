# 🔍 Análisis de Problemas del Login — Proyecto Cerna

> **Fecha del análisis:** 2026-07-13  
> **Archivos analizados:** 15 archivos relacionados con autenticación, autorización y flujo de sesión.

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Archivos Analizados](#2-archivos-analizados)
3. [Problemas Encontrados](#3-problemas-encontrados)
   - [P1 — CRÍTICO: El Proxy (middleware) no exporta correctamente la función](#p1--crítico-el-proxy-middleware-no-exporta-correctamente-la-función)
   - [P2 — CRÍTICO: `signUp` no envía metadata del nombre al registrarse](#p2--crítico-signup-no-envía-metadata-del-nombre-al-registrarse)
   - [P3 — ALTO: `console.log` con datos sensibles en producción](#p3--alto-consolelog-con-datos-sensibles-en-producción)
   - [P4 — ALTO: Navegación post-login con `window.location.href` en vez de `router`](#p4--alto-navegación-post-login-con-windowlocationhref-en-vez-de-router)
   - [P5 — ALTO: Login redirige a todos los usuarios a `/escritorio` sin verificar rol](#p5--alto-login-redirige-a-todos-los-usuarios-a-escritorio-sin-verificar-rol)
   - [P6 — ALTO: Proxy redirige usuarios logueados de `/login` a `/` en vez de `/escritorio`](#p6--alto-proxy-redirige-usuarios-logueados-de-login-a--en-vez-de-escritorio)
   - [P7 — MEDIO: Uso de `alert()` nativo para feedback de registro](#p7--medio-uso-de-alert-nativo-para-feedback-de-registro)
   - [P8 — MEDIO: Tipo `any` en catch blocks — falta de tipado seguro](#p8--medio-tipo-any-en-catch-blocks--falta-de-tipado-seguro)
   - [P9 — MEDIO: Sin validación de longitud mínima de contraseña en el cliente](#p9--medio-sin-validación-de-longitud-mínima-de-contraseña-en-el-cliente)
   - [P10 — BAJO: Falta de accesibilidad — no hay `aria-live` ni roles en el error](#p10--bajo-falta-de-accesibilidad--no-hay-aria-live-ni-roles-en-el-error)
   - [P11 — BAJO: Supabase client se instancia fuera del handler en cada render](#p11--bajo-supabase-client-se-instancia-fuera-del-handler-en-cada-render)
4. [Problemas Colaterales (fuera del login pero relacionados)](#4-problemas-colaterales-fuera-del-login-pero-relacionados)
5. [Plan de Corrección Detallado](#5-plan-de-corrección-detallado)
6. [Priorización](#6-priorización)

---

## 1. Resumen Ejecutivo

El flujo de autenticación tiene **4 problemas críticos/altos** que probablemente están causando fallos funcionales visibles, y **7 problemas de severidad media/baja** que afectan seguridad, UX y mantenibilidad. Los problemas más graves son:

- El **Proxy** (`src/proxy.ts`) no usa el patrón de export correcto para Next.js 16, por lo que podría no ejecutarse.
- El **registro** (`signUp`) no pasa el nombre del usuario en `raw_user_meta_data`, por lo que el trigger de la base de datos siempre asigna `'UsuarioNuevo'` como nombre.
- La **navegación post-login** usa `window.location.href` (full page reload) en lugar de `router.push`, y no respeta el rol del usuario.
- Hay un **`console.log`** que imprime datos del usuario y su perfil en producción.

---

## 2. Archivos Analizados

| Archivo | Relevancia |
|---|---|
| [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx) | 🔴 Página principal de login/registro |
| [`src/proxy.ts`](file:///home/pablo/Projects/Article/src/proxy.ts) | 🔴 Middleware/Proxy — protección de rutas |
| [`src/utils/supabase/client.ts`](file:///home/pablo/Projects/Article/src/utils/supabase/client.ts) | 🟡 Cliente Supabase (browser) |
| [`src/utils/supabase/server.ts`](file:///home/pablo/Projects/Article/src/utils/supabase/server.ts) | 🟡 Cliente Supabase (server) |
| [`src/utils/auth.ts`](file:///home/pablo/Projects/Article/src/utils/auth.ts) | 🟡 Helper de autenticación del servidor |
| [`src/app/actions.ts`](file:///home/pablo/Projects/Article/src/app/actions.ts) | 🟡 Server Action — sign out |
| [`src/lib/constants.ts`](file:///home/pablo/Projects/Article/src/lib/constants.ts) | 🟢 Constantes del sitio |
| [`src/app/escritorio/layout.tsx`](file:///home/pablo/Projects/Article/src/app/escritorio/layout.tsx) | 🟡 Layout protegido del dashboard |
| [`src/app/escritorio/page.tsx`](file:///home/pablo/Projects/Article/src/app/escritorio/page.tsx) | 🟡 Página del dashboard |
| [`src/app/escritorio/perfil/page.tsx`](file:///home/pablo/Projects/Article/src/app/escritorio/perfil/page.tsx) | 🟡 Página de perfil |
| [`src/app/escritorio/nuevo/layout.tsx`](file:///home/pablo/Projects/Article/src/app/escritorio/nuevo/layout.tsx) | 🟢 Layout de nuevo artículo |
| [`src/app/escritorio/editar/[slug]/page.tsx`](file:///home/pablo/Projects/Article/src/app/escritorio/editar/%5Bslug%5D/page.tsx) | 🟢 Página de edición |
| [`src/components/PublicNavBar.tsx`](file:///home/pablo/Projects/Article/src/components/PublicNavBar.tsx) | 🟢 Barra de navegación pública |
| [`src/components/ProfileForm.tsx`](file:///home/pablo/Projects/Article/src/components/ProfileForm.tsx) | 🟢 Formulario de perfil |
| [`database/schema.sql`](file:///home/pablo/Projects/Article/database/schema.sql) | 🟡 Esquema DB con trigger `handle_new_user` |

---

## 3. Problemas Encontrados

---

### P1 — CRÍTICO: El Proxy (middleware) no exporta correctamente la función

**Archivo:** [`src/proxy.ts`](file:///home/pablo/Projects/Article/src/proxy.ts)  
**Línea:** 4

**Problema:**  
En Next.js 16, el archivo `proxy.ts` debe exportar la función como **named export `proxy`** o como **default export**. Actualmente el archivo exporta la función con el nombre correcto (`export async function proxy`), sin embargo el `config` exportado con el `matcher` está al final del archivo y, si el build lo procesa, la ruta debería funcionar. 

Sin embargo, hay un riesgo: el Proxy no está refrescando la sesión de Supabase en todas las rutas correctamente ya que solo protege `/escritorio` y `/login`, pero no refresca las cookies de Supabase para las demás rutas. Esto puede causar que la sesión expire silenciosamente.

**Código actual:**
```ts
export async function proxy(request: NextRequest) { ... }
export const config = {
  matcher: [
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Impacto:** El token de sesión puede no refrescarse en ciertas navegaciones, causando deslogeos inesperados.

---

### P2 — CRÍTICO: `signUp` no envía metadata del nombre al registrarse

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Líneas:** 44–48

**Problema:**  
El formulario de registro NO pide ni envía el nombre del usuario. La llamada a `signUp` solo envía `email` y `password`. El trigger `handle_new_user` en la base de datos lee `NEW.raw_user_meta_data ->> 'nombre'` para asignar el nombre al perfil, pero como no se envía ningún campo `nombre`, el valor siempre será el fallback: `'UsuarioNuevo'`.

**Código actual:**
```ts
const { error } = await supabase.auth.signUp({
  email,
  password,
});
```

**Código esperado:**
```ts
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { nombre: nombre } // ← Campo capturado del formulario
  }
});
```

**Impacto:** Todos los nuevos usuarios se registran con el nombre `'UsuarioNuevo'` en la tabla `perfiles`.

---

### P3 — ALTO: `console.log` con datos sensibles en producción

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Línea:** 37

**Problema:**  
Hay un `console.log('Login successful', { user: data.user, profile })` que imprime el **objeto completo del usuario** (incluyendo ID, email, metadata) y el perfil en la consola del navegador. Esto es un **riesgo de seguridad** en producción.

```ts
console.log('Login successful', { user: data.user, profile });
```

**Impacto:** Datos sensibles del usuario expuestos en la consola del navegador en producción.

---

### P4 — ALTO: Navegación post-login con `window.location.href` en vez de `router`

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Líneas:** 39, 41

**Problema:**  
Después del login exitoso, se usa `window.location.href = '/escritorio'` en vez de `router.push('/escritorio')`. Esto causa un **full page reload** innecesario, pierde el estado de la aplicación, y no aprovecha la navegación SPA de Next.js.

Si bien `window.location.href` es a veces intencional para forzar una recarga de las cookies de sesión, la mejor práctica con Supabase + Next.js es usar `router.push` combinado con `router.refresh()`, o bien redirigir desde un Server Action.

```ts
window.location.href = '/escritorio';  // ← Full reload
window.location.href = '/';            // ← Full reload
```

**Impacto:** Experiencia de usuario degradada — flash de pantalla blanca al redirigir.

---

### P5 — ALTO: Login redirige a todos los usuarios a `/escritorio` sin verificar rol

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Líneas:** 30–42

**Problema:**  
Después del login, el código consulta el perfil del usuario para obtener el rol (`profile`), pero **no usa esa información**. Todos los usuarios se redirigen a `/escritorio`, sin importar si son `usuario` (lector), `escritor` o `admin`. Los usuarios con rol `usuario` son después redirigidos por el dashboard a `/escritorio/perfil`, causando **dos redirecciones innecesarias**.

**Código actual:**
```ts
if (data.user) {
  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', data.user.id)
    .single();
  
  console.log('Login successful', { user: data.user, profile });
  
  window.location.href = '/escritorio'; // ← Ignora el rol
}
```

**Impacto:** Redirecciones en cascada para lectores: `login → /escritorio → /escritorio/perfil`.

---

### P6 — ALTO: Proxy redirige usuarios logueados de `/login` a `/` en vez de `/escritorio`

**Archivo:** [`src/proxy.ts`](file:///home/pablo/Projects/Article/src/proxy.ts)  
**Líneas:** 47–51

**Problema:**  
Si un usuario ya autenticado intenta ir a `/login`, el Proxy lo redirige a `/` (la home pública). Lo lógico sería redirigirlo a `/escritorio` (su dashboard), ya que está autenticado.

```ts
if (user && request.nextUrl.pathname === '/login') {
  const url = request.nextUrl.clone()
  url.pathname = '/'  // ← Debería ser '/escritorio'
  return NextResponse.redirect(url)
}
```

**Impacto:** UX confusa — el usuario logueado rebota a la página pública.

---

### P7 — MEDIO: Uso de `alert()` nativo para feedback de registro

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Línea:** 49

**Problema:**  
Después de un registro exitoso, se usa `alert('Registro exitoso...')`. Esto es inconsistente con el patrón de error que usa un `<div>` en la UI, y es una práctica poco profesional en producción.

```ts
alert('Registro exitoso. Inicia sesión para continuar.');
```

**Impacto:** UX poco profesional, bloquea el hilo del browser.

---

### P8 — MEDIO: Tipo `any` en catch blocks — falta de tipado seguro

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Línea:** 52

**Problema:**  
El catch usa `catch (err: any)`, lo cual desactiva la comprobación de tipos y puede causar errores silenciosos si el error no tiene la propiedad `message`.

```ts
} catch (err: any) {
  setError(err.message || 'Ha ocurrido un error durante la autenticación.');
}
```

**Corrección:**
```ts
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Ha ocurrido un error durante la autenticación.';
  setError(message);
}
```

---

### P9 — MEDIO: Sin validación de longitud mínima de contraseña en el cliente

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)

**Problema:**  
El formulario no valida la longitud mínima de la contraseña. Supabase por defecto requiere al menos 6 caracteres, pero no hay un `minLength` en el `<input>` ni validación antes del submit. Esto resulta en errores crípticos de la API si la contraseña es muy corta.

---

### P10 — BAJO: Falta de accesibilidad — no hay `aria-live` ni roles en el error

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Líneas:** 103–107

**Problema:**  
El div de error no tiene `role="alert"` ni `aria-live="polite"`, por lo que los lectores de pantalla no lo anunciarán automáticamente.

```html
<div className="p-4 border border-red-200 bg-red-50 text-red-800 text-sm">
  <p>{error}</p>
</div>
```

---

### P11 — BAJO: Supabase client se instancia fuera del handler en cada render

**Archivo:** [`src/app/login/page.tsx`](file:///home/pablo/Projects/Article/src/app/login/page.tsx)  
**Línea:** 15

**Problema:**  
`createClient()` se llama en el cuerpo del componente (fuera de `handleAuth`), lo que crea un nuevo cliente en cada render. Según la documentación de `@supabase/ssr`, `createBrowserClient` ya cachea la instancia internamente con un singleton, por lo que esto no causa un bug funcional, pero es mejor práctica asegurar una única llamada.

---

## 4. Problemas Colaterales (fuera del login pero relacionados)

Estos no están directamente en la página de login, pero afectan el flujo de autenticación:

| # | Archivo | Problema | Severidad |
|---|---|---|---|
| C1 | [`src/app/escritorio/page.tsx`](file:///home/pablo/Projects/Article/src/app/escritorio/page.tsx) L57-59 | **Estadísticas hardcodeadas**: `"8:42"`, `"452"`, `"+5%"` — valores falsos que nunca cambian | Medio |
| C2 | [`src/components/ProfileForm.tsx`](file:///home/pablo/Projects/Article/src/components/ProfileForm.tsx) L32 | `catch (error: any)` — mismo problema de tipado que P8 | Medio |
| C3 | [`database/seed_roles.sql`](file:///home/pablo/Projects/Article/database/seed_roles.sql) | Contraseña hardcodeada `'123456'` para todos los usuarios de prueba — aceptable en seed pero debe documentarse | Bajo |
| C4 | [`src/lib/constants.ts`](file:///home/pablo/Projects/Article/src/lib/constants.ts) | URLs de avatar/cover extremadamente largas hardcodeadas como constantes — funcional pero frágil | Bajo |

---

## 5. Plan de Corrección Detallado

### Fase 1 — Correcciones Críticas (Funcionalidad rota)

#### Fix 1.1: Agregar campo de nombre en registro y enviar metadata

**Archivo:** `src/app/login/page.tsx`

1. Agregar un estado `nombre` y un campo `<input>` que solo se muestre en modo registro (`!isLogin`).
2. Pasar el nombre como `options.data.nombre` en la llamada a `signUp`.

```diff
+ const [nombre, setNombre] = useState('');

  // En el signUp:
  const { error } = await supabase.auth.signUp({
    email,
    password,
+   options: {
+     data: { nombre }
+   }
  });
```

```diff
+ {!isLogin && (
+   <div>
+     <label htmlFor="nombre">Nombre</label>
+     <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
+   </div>
+ )}
```

#### Fix 1.2: Eliminar `console.log` con datos del usuario

**Archivo:** `src/app/login/page.tsx`

```diff
- console.log('Login successful', { user: data.user, profile });
```

---

### Fase 2 — Correcciones Altas (UX/Lógica rota)

#### Fix 2.1: Redirección post-login basada en rol

**Archivo:** `src/app/login/page.tsx`

```diff
  if (data.user) {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', data.user.id)
      .single();
    
-   console.log('Login successful', { user: data.user, profile });
-   window.location.href = '/escritorio';
+   const rol = profile?.rol;
+   if (rol === 'escritor' || rol === 'admin') {
+     router.push('/escritorio');
+   } else {
+     router.push('/escritorio/perfil');
+   }
+   router.refresh();
  } else {
-   window.location.href = '/';
+   router.push('/');
+   router.refresh();
  }
```

> **Nota:** Si se detectan problemas de sesión con `router.push`, se puede mantener `window.location.href` como último recurso, pero solo para la primera redirección post-login.

#### Fix 2.2: Proxy redirige usuarios logueados a `/escritorio` en vez de `/`

**Archivo:** `src/proxy.ts`

```diff
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
-   url.pathname = '/'
+   url.pathname = '/escritorio'
    return NextResponse.redirect(url)
  }
```

#### Fix 2.3: Reemplazar `alert()` con feedback inline en la UI

**Archivo:** `src/app/login/page.tsx`

```diff
- alert('Registro exitoso. Inicia sesión para continuar.');
+ setError(null);
+ setSuccessMessage('Registro exitoso. Inicia sesión para continuar.');
  setIsLogin(true);
```

Agregar un estado `successMessage` y un `<div>` similar al de error pero con estilo verde.

---

### Fase 3 — Correcciones Medias (Calidad de código)

#### Fix 3.1: Tipado seguro en catch blocks

**Archivos:** `src/app/login/page.tsx`, `src/components/ProfileForm.tsx`

```diff
- } catch (err: any) {
-   setError(err.message || 'Ha ocurrido un error.');
+ } catch (err: unknown) {
+   const message = err instanceof Error ? err.message : 'Ha ocurrido un error durante la autenticación.';
+   setError(message);
  }
```

#### Fix 3.2: Agregar `minLength` a la contraseña

**Archivo:** `src/app/login/page.tsx`

```diff
  <input
    id="password"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
+   minLength={6}
    ...
  />
```

#### Fix 3.3: Agregar accesibilidad al error

**Archivo:** `src/app/login/page.tsx`

```diff
- <div className="p-4 border border-red-200 bg-red-50 text-red-800 text-sm">
+ <div role="alert" aria-live="polite" className="p-4 border border-red-200 bg-red-50 text-red-800 text-sm">
```

---

### Fase 4 — Correcciones Colaterales

#### Fix 4.1: Eliminar estadísticas hardcodeadas del dashboard

**Archivo:** `src/app/escritorio/page.tsx`

Las líneas 57-59 contienen valores fijos (`"8:42"`, `"452"`, `"+5%"`). Opciones:
- **Opción A:** Calcular valores reales con queries a Supabase.
- **Opción B (pragmática):** Ocultarlos o marcarlos como "Próximamente" hasta que se tenga la lógica.

---

## 6. Priorización

| Prioridad | Issue | Esfuerzo | Fix |
|---|---|---|---|
| 🔴 P1 | SignUp sin nombre | Bajo | Fix 1.1 |
| 🔴 P2 | Console.log con datos sensibles | Trivial | Fix 1.2 |
| 🟠 P3 | Redirección sin lógica de rol | Medio | Fix 2.1 |
| 🟠 P4 | Proxy redirige a `/` en vez de `/escritorio` | Trivial | Fix 2.2 |
| 🟠 P5 | `alert()` nativo | Bajo | Fix 2.3 |
| 🟡 P6 | `catch (err: any)` | Trivial | Fix 3.1 |
| 🟡 P7 | Sin `minLength` en password | Trivial | Fix 3.2 |
| 🟡 P8 | Sin accesibilidad en error | Trivial | Fix 3.3 |
| 🟡 C1 | Stats hardcodeadas en dashboard | Medio | Fix 4.1 |

---

> [!IMPORTANT]
> Los fixes 1.1, 1.2 y 2.1 son los más urgentes y probablemente están causando los problemas visibles de login que reportas. Se recomienda aplicarlos primero y probar antes de continuar con el resto.
