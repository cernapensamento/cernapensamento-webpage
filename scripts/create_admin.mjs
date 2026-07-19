import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Asegúrate de ejecutar el script con: node --env-file=.env.local scripts/create_admin.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Uso incorrecto.");
  console.error("Ejecuta: node --env-file=.env.local scripts/create_admin.mjs admin@correo.com password123");
  process.exit(1);
}

async function createAdmin() {
  console.log(`Intentando crear cuenta de administrador para: ${email}...`);

  // 1. Crear el usuario en Auth (esto disparará el trigger que lo inserta en perfiles como 'usuario')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log("El usuario ya existe en Supabase Auth. Intentando promoverlo a admin...");
        
        // Buscar su ID
        const { data: searchData, error: searchError } = await supabase.auth.admin.listUsers();
        const existingUser = searchData?.users.find(u => u.email === email);
        
        if (existingUser) {
            await promoteToAdmin(existingUser.id);
        } else {
            console.error("No se pudo encontrar el ID del usuario existente.");
        }
        return;
    }
    console.error("❌ Error creando el usuario en Auth:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("✅ Usuario creado en Auth con éxito. ID:", userId);
  
  // Dar un poco de tiempo para que el Trigger de Supabase complete el insert en perfiles
  await new Promise(r => setTimeout(r, 1000));
  
  await promoteToAdmin(userId);
}

async function promoteToAdmin(userId) {
  console.log("Promoviendo a rol 'admin'...");
  
  // 2. Actualizar el rol en la tabla perfiles
  const { error: updateError } = await supabase
    .from('perfiles')
    .update({ rol: 'admin' })
    .eq('id', userId);

  if (updateError) {
    if (updateError.message.includes('only_one_admin_idx')) {
      console.error("❌ ERROR: Ya existe un administrador en la base de datos.");
      console.error("La norma (índice only_one_admin_idx) impide crear múltiples admins.");
      process.exit(1);
    }
    console.error("❌ Error asignando el rol de admin:", updateError.message);
    process.exit(1);
  }

  console.log("🎉 ¡Administrador configurado con éxito!");
}

createAdmin();
