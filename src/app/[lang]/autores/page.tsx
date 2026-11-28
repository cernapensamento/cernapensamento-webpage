import type { Metadata } from 'next';
import { getDictionary } from '@/dictionaries';
import { resolveLocale } from '@/i18n-config';
import { resolveAuthorBio, resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { resolveAlternateLocaleBadge } from '@/components/features/publicationCardHelpers';
import { getColumnistBySlug } from '@/lib/columnists';
import { SITE_NAME } from '@/lib/constants';
import { getPublishedAuthors } from '@/lib/db';
import AuthorsDirectory, {
  type AuthorDirectoryItem,
} from '@/components/features/AuthorsDirectory';

export const revalidate = 60;

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);

  const title = `${dict.autoresPage.eyebrow} | ${SITE_NAME}`;

  return {
    title,
    description: dict.autoresPage.metaDescription,
    openGraph: {
      title,
      description: dict.autoresPage.metaDescription,
      type: 'website',
    },
  };
}

export default async function AutoresPage({ params }: Props) {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const [dict, publishedAuthors] = await Promise.all([
    getDictionary(locale),
    getPublishedAuthors(),
  ]);

  const authors: AuthorDirectoryItem[] = publishedAuthors.map((author) => {
    const columnist = getColumnistBySlug(author.slug);
    const bio = resolveAuthorBio(author, dict.authors, locale);

    const latestPublicationTitle = author.latest_publication_title
      ? resolveLocalizedText(
          author.latest_publication_title,
          locale,
          author.latest_publication_original_language || locale
        )
      : null;
    const latestPublicationLanguageBadge = author.latest_publication_title
      ? resolveAlternateLocaleBadge(
          {
            id: author.latest_publication_slug || author.id,
            title: author.latest_publication_title,
            original_language: author.latest_publication_original_language,
          },
          locale,
          dict
        )
      : null;

    return {
      id: author.id,
      full_name: author.full_name,
      slug: author.slug,
      avatar_url: columnist?.image || author.avatar_url,
      bio,
      roles: author.roles,
      published_count: author.published_count,
      latest_publication_at: author.latest_publication_at,
      latest_publication_title: latestPublicationTitle,
      latest_publication_slug: author.latest_publication_slug,
      latest_publication_language_badge: latestPublicationLanguageBadge,
      publication_types: author.publication_types,
    };
  });

  return (
    <AuthorsDirectory
      authors={authors}
      lang={locale}
      dict={dict.autoresPage}
      documentTypes={dict.documentTypes}
    />
  );
}
