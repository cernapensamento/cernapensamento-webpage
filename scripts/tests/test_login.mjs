import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin(email, password) {
  console.log(`\nTesting login for: ${email}`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.error('Login error:', error.message);
    return;
  }
  
  console.log('Login success! User ID:', data.user.id);
  
  const { data: profile, error: profileError } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', data.user.id)
    .single();
    
  if (profileError) {
    console.error('Profile fetch error:', profileError.message);
  } else {
    console.log('Profile role:', profile.rol);
  }
}

async function main() {
  await testLogin('escritor@cerna.com', '123456');
  await testLogin('escritor@cerna.es', '123456');
}

main();
