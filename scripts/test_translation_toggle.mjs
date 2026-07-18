import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: articulos, error } = await supabase.from('articulos').select('id, titulo_gl, titulo_es').limit(1);
  if (error || !articulos || articulos.length === 0) {
    console.error('Error fetching articles', error);
    return;
  }
  
  const targetId = articulos[0].id;
  
  const { error: updateError } = await supabase.from('articulos').update({
    titulo_es: '[ESP] ' + articulos[0].titulo_gl,
    subtitulo_es: '[Traducción al Castellano de este artículo para probar el selector]',
    contenido_es: '<p>Este es el contenido de prueba traducido al Castellano para verificar que el botón LanguageToggle en la página del artículo cambia correctamente el texto cuando cambiamos la cookie a ES.</p>'
  }).eq('id', targetId);
  
  if (updateError) {
    console.error('Error updating:', updateError);
  } else {
    console.log(`Successfully updated article ${targetId} with Spanish content.`);
  }
}
main();
