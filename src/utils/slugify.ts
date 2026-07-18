import { createClient } from '@/utils/supabase/client';

export function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separa acentos de las letras
    .replace(/[\u0300-\u036f]/g, '') // elimina los acentos
    .replace(/\s+/g, '-') // reemplaza espacios por guiones
    .replace(/[^\w\-]+/g, '') // elimina todo lo que no sea palabra, numero o guion
    .replace(/\-\-+/g, '-') // reemplaza multiples guiones por uno
    .replace(/^-+/, '') // elimina guiones al principio
    .replace(/-+$/, ''); // elimina guiones al final
}

export async function generateUniqueAuthorSlug(nombre: string): Promise<string> {
  const baseSlug = createSlug(nombre);
  let slug = baseSlug;
  let counter = 1;
  const supabase = createClient();

  while (true) {
    const { data } = await supabase
      .from('perfiles')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) {
      break; // El slug es único
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
