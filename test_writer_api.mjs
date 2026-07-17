import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  // 1. Log in
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'escritor@cernapensamento.org',
    password: '123456'
  });
  
  if (authErr) {
    console.log("Auth error:", authErr.message);
    process.exit(1);
  }
  
  console.log("Logged in user:", authData.user.id);
  
  // 2. Fetch profile
  const { data: profile, error: profErr } = await supabase
    .from('perfiles')
    .select('rol, avatar_url')
    .eq('id', authData.user.id)
    .single();
    
  console.log("Profile error:", profErr);
  console.log("Profile data:", profile);
})();
