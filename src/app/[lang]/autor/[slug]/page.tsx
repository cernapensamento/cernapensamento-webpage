import { createClient } from '@/utils/supabase/server';
import { ARTICLE_STATES, DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';
import { getColumnistBySlug } from '@/lib/columnists';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import AuthorProfileView from '@/components/features/AuthorProfileView';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
  const supabase = await createClient();

  const query = isUUID
    ? supabase.from('perfiles').select('nombre, bio').eq('id', slug).single()
    : supabase.from('perfiles').select('nombre, bio').eq('slug', slug).single();

  const { data: autor } = await query;
  if (!autor) return {};

  const dict = await getDictionary(lang as Locale);
  const bio = (slug && dict.authors && (dict.authors as Record<string, string>)[slug]) || autor.bio;
  const title = `${autor.nombre} · ${SITE_NAME}`;
  const defaultMetaDesc = (dict.authorPage as Record<string, string> | undefined)?.defaultMetaDescription;
  const description = bio || (defaultMetaDesc
    ? defaultMetaDesc.replace('{name}', autor.nombre).replace('{site}', SITE_NAME)
    : `Textos e ensaios de ${autor.nombre} en ${SITE_NAME}.`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
  };
}

export default async function AutorPage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug, lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  // Fetch author profile
  let profileQuery = supabase.from('perfiles').select('*');
  if (isUUID) {
    profileQuery = profileQuery.eq('id', slug);
  } else {
    profileQuery = profileQuery.eq('slug', slug);
  }

  const { data: autor, error: perfilError } = await profileQuery.single();

  if (perfilError || !autor) {
    notFound();
  }

  // Cross-reference with predefined columnists data (local photos, emails, instagram)
  const columnist = getColumnistBySlug(autor.slug);
  const avatarSrc = columnist?.image || autor.avatar_url || DEFAULT_AVATAR_URL;
  const bio = (autor.slug && dict.authors && (dict.authors as Record<string, string>)[autor.slug]) || autor.bio || '';

  // Determine editorial role badge:
  // - 'escritor' (or founder columnist) -> "Miembro fundador de Cerna" / "Membro fundador de Cerna"
  // - 'invitado' -> "Colaborador en Cerna"
  // - 'admin' -> "Consejo Editorial" / "Consello Editorial"
  const roleLabel = autor.rol === 'admin'
    ? (dict.authorPage?.editorialBoard || 'Consello Editorial')
    : (autor.rol === 'escritor' || columnist)
    ? (dict.authorPage?.foundingMember || 'Membro fundador de Cerna')
    : (dict.authorPage?.cernaContributor || 'Colaborador en Cerna');

  // Fetch published articles
  const { data: articulosRaw } = await supabase
    .from('articulos')
    .select('id, slug, tipo, titulo_gl, titulo_es, subtitulo_gl, subtitulo_es, imagen_url, tematicas, creado_en, actualizado_en, fijado')
    .eq('autor_id', autor.id)
    .eq('estado', ARTICLE_STATES.PUBLISHED);

  // Sort strictly by publication date descending (newest first, no artificial pinning bias on author archive)
  const articulos = (articulosRaw || []).sort((a, b) => {
    const dateA = new Date(a.actualizado_en || a.creado_en).getTime();
    const dateB = new Date(b.actualizado_en || b.creado_en).getTime();
    return dateB - dateA;
  });

  // Extract distinct thematic areas and frequency count across the author's published articles
  const topicCounts: Record<string, number> = {};
  articulos.forEach(art => {
    if (Array.isArray(art.tematicas)) {
      art.tematicas.forEach((t: string) => {
        if (t && typeof t === 'string') {
          const clean = t.trim();
          topicCounts[clean] = (topicCounts[clean] || 0) + 1;
        }
      });
    }
  });

  const uniqueTopicSlugs = Object.keys(topicCounts);
  let availableTopics: { slug: string; name: string; count: number }[] = [];

  if (uniqueTopicSlugs.length > 0) {
    const { data: tagTrans } = await supabase
      .from('tags')
      .select('slug, tag_translations(lang, name)')
      .in('slug', uniqueTopicSlugs);

    availableTopics = uniqueTopicSlugs.map(slug => {
      const t = tagTrans?.find(tt => tt.slug === slug);
      let name = slug;
      if (t && t.tag_translations && Array.isArray(t.tag_translations)) {
        const trans = t.tag_translations.find((tr: { lang: string; name: string }) => tr.lang === lang);
        if (trans?.name) {
          name = trans.name;
        } else if (t.tag_translations.length > 0 && t.tag_translations[0].name) {
          name = t.tag_translations[0].name;
        }
      }
      if (name === name.toUpperCase() && name.length > 3) {
        name = name.charAt(0) + name.slice(1).toLowerCase();
      } else {
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }
      return { slug, name, count: topicCounts[slug] };
    }).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }

  const totalWorks = articulos.length;
  const worksCountLabel = totalWorks === 1
    ? `1 ${dict.authorPage?.publishedWorkSingular || 'texto publicado'}`
    : `${totalWorks} ${dict.authorPage?.publishedWorks || 'textos publicados'}`;

  return (
    <AuthorProfileView
      autor={autor}
      columnist={columnist}
      avatarSrc={avatarSrc}
      bio={bio}
      roleLabel={roleLabel}
      worksCountLabel={worksCountLabel}
      availableTopics={availableTopics}
      articulos={articulos}
      lang={lang}
      dict={dict}
    />
  );
}
