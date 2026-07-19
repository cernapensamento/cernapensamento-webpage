import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const slug = 'hector-gonzalez';
  const { data: autor, error: perfilError } = await supabase.from('perfiles').select('*').eq('slug', slug).single();
  console.log("Autor by slug:", autor, perfilError);
}

test();
