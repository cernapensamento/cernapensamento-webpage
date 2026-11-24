import type { LocalizedString } from '@/lib/db/types';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import { i18n } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { resolveAlternateLocaleBadge } from '@/components/features/publicationCardHelpers';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';

export interface SectionArticleData {
  id: string | number;
  slug?: string | null;
  type?: string;
  tipo?: string;
  original_language?: string | null;
  idioma_original?: string | null;
  title?: LocalizedString;
  subtitle?: LocalizedString | null;
  content?: LocalizedString;
  titulo_es?: string;
  titulo_gl?: string;
  subtitulo_es?: string;
  subtitulo_gl?: string;
  contenido_es?: string;
  contenido_gl?: string;
  author?: {
    full_name?: string;
    nombre?: string;
    avatar_url?: string | null;
    slug?: string | null;
  } | null;
  perfiles?: {
    nombre?: string;
  } | null;
  cover_image_url?: string | null;
  imagen_url?: string | null;
}

export interface SectionArticleDict {
  documentTypes?: Record<string, string>;
  articles?: Partial<Dictionary['articles']>;
  mosaic?: Partial<Dictionary['mosaic']>;
  authorPage?: Partial<Dictionary['authorPage']>;
  pinnedTitle?: string;
  readArticle?: string;
  [key: string]: unknown;
}

export interface ResolvedSectionArticle {
  href: string;
  titulo: string;
  subtitulo: string | null;
  rawContent: string;
  typeLabel: string;
  coverUrl: string | null;
  coverAlt: string;
  authorName: string;
  byLabel: string;
  alternateLocaleBadge: string | null;
}

/**
 * Resolves localized article metadata, author fallback, and dictionary labels
 * consistently across section components without hardcoding locale branches.
 */
export function resolveSectionArticle(
  articulo: SectionArticleData,
  lang: string,
  dict?: SectionArticleDict,
  fallbackDict: Dictionary = getDictionaryClient(lang)
): ResolvedSectionArticle {
  const fallbackLang = articulo.original_language || articulo.idioma_original || i18n.defaultLocale;

  const titulo =
    resolveLocalizedText(articulo.title, lang, fallbackLang) ||
    resolveLocalizedText({ gl: articulo.titulo_gl, es: articulo.titulo_es }, lang, fallbackLang);

  const subtitulo =
    resolveLocalizedText(articulo.subtitle, lang, fallbackLang) ||
    resolveLocalizedText({ gl: articulo.subtitulo_gl, es: articulo.subtitulo_es }, lang, fallbackLang) ||
    null;

  const rawContent =
    resolveLocalizedText(articulo.content, lang, fallbackLang) ||
    resolveLocalizedText({ gl: articulo.contenido_gl, es: articulo.contenido_es }, lang, fallbackLang);

  const documentTypes: Record<string, string> = {
    ...(fallbackDict.documentTypes as Record<string, string>),
    ...(dict?.documentTypes ?? {}),
  };
  const typeKey = (articulo.type || articulo.tipo || PUBLICATION_TYPES.ARTICLE).toLowerCase();
  const typeLabel =
    documentTypes[typeKey] ||
    documentTypes[typeKey === PUBLICATION_TYPES.ARTICLE ? 'artigo' : typeKey] ||
    typeKey;

  const coverUrl = articulo.cover_image_url || articulo.imagen_url || null;
  const coverAlt =
    titulo ||
    dict?.articles?.featuredCoverAlt ||
    dict?.authorPage?.featuredCoverAlt ||
    fallbackDict.articles.featuredCoverAlt;

  const unknownAuthor = dict?.articles?.unknownAuthor || fallbackDict.articles.unknownAuthor;
  const authorName =
    articulo.author?.full_name ||
    articulo.author?.nombre ||
    articulo.perfiles?.nombre ||
    unknownAuthor;

  const byLabel = dict?.articles?.by || dict?.mosaic?.by || fallbackDict.articles.by;
  const alternateLocaleBadge = resolveAlternateLocaleBadge(articulo, lang, dict, fallbackDict);

  return {
    href: `/${lang}/articulo/${articulo.slug || articulo.id}`,
    titulo,
    subtitulo,
    rawContent,
    typeLabel,
    coverUrl,
    coverAlt,
    authorName,
    byLabel,
    alternateLocaleBadge,
  };
}

/** Extracts a plain-text excerpt from HTML content when subtitle is absent. */
export function stripHtmlExcerpt(html: string, maxLength: number): string {
  if (!html) return '';
  return `${html.replace(/<[^>]*>?/g, '').substring(0, maxLength)}...`;
}
