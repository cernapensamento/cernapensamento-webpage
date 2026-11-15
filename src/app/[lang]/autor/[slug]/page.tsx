import { DEFAULT_AVATAR_URL, SITE_NAME } from '@/lib/constants';
import { getColumnistBySlug } from '@/lib/columnists';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import type { Metadata } from 'next';
import AuthorProfileView from '@/components/features/AuthorProfileView';
import { getUserBySlugOrId, getAuthorProfileBySlugOrId } from '@/lib/db';
import { USER_ROLES } from '@/lib/db/schema';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const locale = resolveLocale(lang);
  const [user, dict] = await Promise.all([
    getUserBySlugOrId(slug),
    getDictionary(locale),
  ]);
  if (!user) return {};

  const authorKey = user.slug || slug;
  const bio =
    (authorKey && (dict.authors as Record<string, string>)[authorKey]) ||
    resolveLocalizedText(user.bio, locale);
  const title = `${user.full_name} · ${SITE_NAME}`;
  const description =
    bio ||
    dict.authorPage.defaultMetaDescription
      .replace('{name}', user.full_name)
      .replace('{site}', SITE_NAME);

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
  const locale = resolveLocale(lang);
  const [dict, profile] = await Promise.all([
    getDictionary(locale),
    getAuthorProfileBySlugOrId(slug, undefined, locale),
  ]);

  if (!profile) {
    notFound();
  }

  // Cross-reference with predefined columnists data (local photos, emails, instagram)
  const columnist = getColumnistBySlug(profile.slug || '');
  const avatarSrc = columnist?.image || profile.avatar_url || DEFAULT_AVATAR_URL;
  const bio =
    (profile.slug && (dict.authors as Record<string, string>)[profile.slug]) ||
    resolveLocalizedText(profile.bio, locale);

  // Determine editorial role badge:
  // - USER_ROLES.ADMIN -> editorialBoard
  // - USER_ROLES.FOUNDER (or founder columnist) -> foundingMember
  // - others -> cernaContributor
  const roleLabel =
    profile.role === USER_ROLES.ADMIN
      ? dict.authorPage.editorialBoard
      : profile.role === USER_ROLES.FOUNDER || columnist
        ? dict.authorPage.foundingMember
        : dict.authorPage.cernaContributor;

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
  const worksCountLabel =
    totalWorks === 1
      ? `1 ${dict.authorPage.publishedWorkSingular}`
      : `${totalWorks} ${dict.authorPage.publishedWorks}`;

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
      lang={locale}
      dict={dict}
    />
  );
}

