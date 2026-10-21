import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';
import { getColumnistBySlug } from '@/lib/columnists';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import AuthorProfileView from '@/components/features/AuthorProfileView';
import { getUserBySlugOrId, getAuthorProfileBySlugOrId } from '@/lib/db';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const user = await getUserBySlugOrId(slug);
  if (!user) return {};

  const dict = await getDictionary(lang as Locale);
  const bio = (slug && dict.authors && (dict.authors as Record<string, string>)[slug])
    || (user.bio ? (user.bio[lang] || user.bio.gl || user.bio.es) : '');
  const title = `${user.full_name} · ${SITE_NAME}`;
  const defaultMetaDesc = (dict.authorPage as Record<string, string> | undefined)?.defaultMetaDescription;
  const description = bio || (defaultMetaDesc
    ? defaultMetaDesc.replace('{name}', user.full_name).replace('{site}', SITE_NAME)
    : `Textos e ensaios de ${user.full_name} en ${SITE_NAME}.`);

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
  const { slug, lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const profile = await getAuthorProfileBySlugOrId(slug, undefined, lang);
  if (!profile) {
    notFound();
  }

  // Cross-reference with predefined columnists data (local photos, emails, instagram)
  const columnist = getColumnistBySlug(profile.slug || '');
  const avatarSrc = columnist?.image || profile.avatar_url || DEFAULT_AVATAR_URL;
  const bio = (profile.slug && dict.authors && (dict.authors as Record<string, string>)[profile.slug])
    || (profile.bio ? (profile.bio[lang] || profile.bio.gl || profile.bio.es) : '')
    || '';

  // Determine editorial role badge:
  // - 'admin' -> "Consejo Editorial" / "Consello Editorial"
  // - 'founder' (or founder columnist) -> "Miembro fundador de Cerna" / "Membro fundador de Cerna"
  // - others -> "Colaborador en Cerna"
  const roleLabel = profile.role === 'admin'
    ? (dict.authorPage?.editorialBoard || 'Consello Editorial')
    : (profile.role === 'founder' || columnist)
    ? (dict.authorPage?.foundingMember || 'Membro fundador de Cerna')
    : (dict.authorPage?.cernaContributor || 'Colaborador en Cerna');

  // Extract distinct topics and frequency count across the author's publications
  const topicCounts: Record<string, { slug: string; name: string; count: number }> = {};
  profile.publications.forEach((pub) => {
    pub.tags.forEach((t) => {
      if (t.slug) {
        if (!topicCounts[t.slug]) {
          topicCounts[t.slug] = { slug: t.slug, name: t.name, count: 0 };
        }
        topicCounts[t.slug].count += 1;
      }
    });
  });

  const availableTopics = Object.values(topicCounts).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  const totalWorks = profile.publications.length;
  const worksCountLabel = totalWorks === 1
    ? `1 ${dict.authorPage?.publishedWorkSingular || 'texto publicado'}`
    : `${totalWorks} ${dict.authorPage?.publishedWorks || 'textos publicados'}`;

  return (
    <AuthorProfileView
      autor={{
        id: profile.id,
        nombre: profile.full_name,
        full_name: profile.full_name,
        bio,
        avatar_url: profile.avatar_url,
        rol: profile.role,
        role: profile.role,
        slug: profile.slug,
      }}
      columnist={columnist}
      avatarSrc={avatarSrc}
      bio={bio}
      roleLabel={roleLabel}
      worksCountLabel={worksCountLabel}
      availableTopics={availableTopics}
      publications={profile.publications}
      lang={lang}
      dict={dict}
    />
  );
}

