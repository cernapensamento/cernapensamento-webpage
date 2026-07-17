import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].trim();
  return acc;
}, {});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function testDelete() {
  // Login as Anxo (tester)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'anxoperez@cernapensamento.org',
    password: '123456'
  });
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log("Logged in as Anxo:", userId);

  // Get articles
  const { data: articles } = await supabase.from('articulos').select('id').limit(1);
  if (!articles || articles.length === 0) {
    console.log("No articles found");
    return;
  }
  const articleId = articles[0].id;

  // Create a comment
  const { data: insertData, error: insertError } = await supabase.from('comentarios').insert({
    articulo_id: articleId,
    autor_id: userId,
    contenido: "Test comment to be deleted"
  }).select().single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return;
  }

  const commentId = insertData.id;
  console.log("Created comment:", commentId);

  // Try to delete it
  const { data: deleteData, error: deleteError } = await supabase.from('comentarios').delete().eq('id', commentId).select();
  
  if (deleteError) {
    console.error("Delete error:", deleteError);
  } else {
    console.log("Delete result:", deleteData);
    if (deleteData.length === 0) {
      console.log("WARNING: Delete returned 0 rows! This means RLS prevented the deletion.");
    } else {
      console.log("SUCCESS: Delete worked.");
    }
  }

  // Check if it still exists
  const { data: checkData } = await supabase.from('comentarios').select('id').eq('id', commentId);
  if (checkData && checkData.length > 0) {
    console.log("Comment STILL exists in DB.");
  } else {
    console.log("Comment is GONE from DB.");
  }
}

testDelete();
