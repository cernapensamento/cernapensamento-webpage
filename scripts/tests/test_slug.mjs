import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('perfiles').select('id, nombre, slug');
  console.log("Perfiles:", data);
  if (error) console.error("Error:", error);
}

test();
