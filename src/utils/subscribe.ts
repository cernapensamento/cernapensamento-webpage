import { createClient } from '@/utils/supabase/client';

export async function subscribeEmail(email: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('suscriptores')
    .insert([{ email }]);
    
  if (error && error.code !== '23505') {
    throw error;
  }
}
