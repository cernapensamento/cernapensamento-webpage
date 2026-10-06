const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadBase64Image(base64Data, format, autorId, index) {
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `contenido/${autorId || 'general'}/migrated-${Date.now()}-${index}.${format}`;
  
  const contentType = `image/${format === 'jpg' ? 'jpeg' : format}`;
  
  console.log(`Uploading ${filename} (${(buffer.length / 1024).toFixed(1)} KB)...`);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('imagenes-articulos')
    .upload(filename, buffer, {
      contentType,
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload ${filename}: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('imagenes-articulos')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

async function cleanHtml(html, autorId) {
  if (!html || !html.includes(';base64,')) return html;

  const base64Regex = /data:image\/([a-zA-Z0-9]+);base64,([A-Za-z0-9+/=]+)/g;
  const matches = [];
  let match;

  while ((match = base64Regex.exec(html)) !== null) {
    matches.push({
      fullMatch: match[0],
      format: match[1],
      base64Data: match[2]
    });
  }

  let cleaned = html;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const publicUrl = await uploadBase64Image(m.base64Data, m.format, autorId, i);
    cleaned = cleaned.replace(m.fullMatch, publicUrl);
  }

  return cleaned;
}

async function run() {
  console.log('Searching for articles with base64 images...');
  const { data: articles, error } = await supabase
    .from('articulos')
    .select('id, slug, autor_id, contenido_gl, contenido_es');

  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  for (const art of articles) {
    const hasGl = (art.contenido_gl || '').includes(';base64,');
    const hasEs = (art.contenido_es || '').includes(';base64,');

    if (hasGl || hasEs) {
      console.log(`\nFound article with base64: [${art.slug}]`);
      const beforeSize = ((art.contenido_gl || '').length + (art.contenido_es || '').length) / (1024 * 1024);
      console.log(`Original content size: ${beforeSize.toFixed(2)} MB`);

      const cleanedGl = await cleanHtml(art.contenido_gl, art.autor_id);
      const cleanedEs = await cleanHtml(art.contenido_es, art.autor_id);

      const afterSize = ((cleanedGl || '').length + (cleanedEs || '').length) / 1024;
      console.log(`Cleaned content size: ${afterSize.toFixed(2)} KB`);

      const { error: updateError } = await supabase
        .from('articulos')
        .update({
          contenido_gl: cleanedGl,
          contenido_es: cleanedEs
        })
        .eq('id', art.id);

      if (updateError) {
        console.error(`Error updating article ${art.slug}:`, updateError);
      } else {
        console.log(`Successfully updated [${art.slug}] in database! Reduced from ${beforeSize.toFixed(2)} MB to ${afterSize.toFixed(2)} KB.`);
      }
    }
  }

  console.log('\nMigration complete!');
}

run().catch(console.error);
