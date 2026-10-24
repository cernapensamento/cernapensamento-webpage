import type { Metadata } from 'next';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
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
  const dict = await getDictionary(lang as Locale);

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
  const dict = await getDictionary(lang as Locale);
  const publishedAuthors = await getPublishedAuthors();

  const language = lang === 'es' ? 'es' : 'gl';
  const authorBios = dict.authors as Record<string, string>;

  const authors: AuthorDirectoryItem[] = publishedAuthors.map((author) => {
    const columnist = getColumnistBySlug(author.slug);
    const bio =
      (author.slug ? authorBios[author.slug] : '') ||
      (author.bio
        ? author.bio[language] || author.bio.gl || author.bio.es
        : '') ||
      columnist?.bio?.[language] ||
      '';

    const latestPublicationTitle = author.latest_publication_title
      ? author.latest_publication_title[language] ||
        author.latest_publication_title.gl ||
        author.latest_publication_title.es
      : null;

    return {
      id: author.id,
      full_name: author.full_name,
      slug: author.slug,
      avatar_url: columnist?.image || author.avatar_url,
      bio,
      role: author.role,
      published_count: author.published_count,
      latest_publication_at: author.latest_publication_at,
      latest_publication_title: latestPublicationTitle,
      latest_publication_slug: author.latest_publication_slug,
      publication_types: author.publication_types,
    };
  });

  return (
    <AuthorsDirectory
      authors={authors}
      lang={lang}
      dict={dict.autoresPage}
      documentTypes={dict.documentTypes as Record<string, string>}
    />
  );
}
