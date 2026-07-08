import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('articulos').select('*, perfiles(nombre)').order('creado_en', { ascending: false });
console.log("Error:", error);
console.log("Data:", data);
