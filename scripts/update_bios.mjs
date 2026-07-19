import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const columnists = [
  {
    slug: 'diego-araujo',
    bio: 'Estudante de Economía na USC, Premio Extraordinario de Bacharelato 2025 e gañador do Parlamento Xove 2026 (categoría universidade) xunto a Héctor González Prego, recoñecido ademais como Mellor Orador da edición. As súas columnas nacen dunha inquietude por entender o mundo dende a filosofía política, a economía, as ciencias políticas e o dereito, cun interese especial no estudo da liberdade, ademais de artigos máis técnicos centrados na análise político-filosófica, a economía austríaca e os fundamentos macro e microeconómicos.',
    image: '/images/columnistas/diego.jpeg'
  },
  {
    slug: 'hector-gonzalez',
    bio: 'Estudante de Física na Universidade de Santiago de Compostela e de Matemáticas na UNED, gañador do Parlamento Xove 2026 na categoría universitaria xunto a Diego Araújo Rodríguez. Os seus artigos nacen da curiosidade científica e do interese por comprender o mundo a través de modelos científicos, especialmente matemáticos, así como por transmitir estas ideas dun xeito claro, rigoroso e accesible. Busca achegar conceptos útiles e aplicables, sen renunciar á reflexión, con interese tamén por ámbitos como a psicoloxía e a comunicación.',
    image: '/images/columnistas/hector.jpeg'
  },
  {
    slug: 'denis-fernandez',
    bio: 'Estuda o dobre grao bilingüe en Dereito e Administración e Dirección de Empresas (ADE) na Universidade Carlos III de Madrid. No ámbito do debate, foi distinguido na categoría de Bacharelato como mellor orador na fase previa do Parlamento Xove na edición de 2025. Os seus artigos nacen do interese por analizar a realidade socioeconómica e xurídica actual, cunha mirada especialmente centrada nos retos, perspectivas e problemáticas que afronta a mocidade de hoxe en día.',
    image: '/images/columnistas/denis.jpeg'
  },
  {
    slug: 'anxo-perez',
    bio: 'Estudante de Lingua e Literatura Españolas na Universidade de Navarra. A súa obra foi recoñecida en certames literarios galegos, como o Premio de Poesía «Cambados Mar de Letras» e o «Certame Literario de Ames», e en 2025 foi distinguido como mellor orador da categoría de Bacharelato na fase final de Parlamento Xove. A súa escrita céntrase no problema da identidade, con especial atención á tradición como forma de resistencia. Aborda o proceso de secularización de Europa e dialoga coa tradición galeguista e co pensamento europeo.',
    image: '/images/columnistas/anxo.jpeg'
  }
];

async function updateBios() {
  console.log('Iniciando inyección de biografías y avatares en la base de datos...\n');
  let successCount = 0;

  for (const author of columnists) {
    console.log(`Buscando autor con slug: ${author.slug}...`);
    
    const { data, error } = await supabase
      .from('perfiles')
      .update({ 
        bio: author.bio, 
        avatar_url: author.image 
      })
      .eq('slug', author.slug)
      .select();

    if (error) {
      console.error(`❌ Error actualizando a ${author.slug}:`, error.message);
    } else {
      if (data && data.length > 0) {
        console.log(`✅ Biografía actualizada correctamente para: ${data[0].nombre}`);
        successCount++;
      } else {
         console.warn(`⚠️ No se encontró ningún autor en la tabla perfiles con el slug: ${author.slug}`);
      }
    }
  }
  
  console.log(`\nProceso completado. Se actualizaron ${successCount} perfiles.`);
}

updateBios();
