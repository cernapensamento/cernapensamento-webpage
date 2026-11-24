import type { LocalizedString, TagItem } from '@/lib/db/types';
import {
  PUBLICATION_TYPES,
  normalizePublicationType,
  type PublicationTypeValue,
} from '@/lib/db/schema';
import { i18n, isSupportedLocale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import { resolvePublicationLocale } from '@/lib/i18n/publicationLanguage';
import { getDictionaryClient, type Dictionary } from '@/dictionaries/client';

/**
 * Structural shape accepted by publication cards, grids, and author archive views,
 * covering both canonical English DAL objects and legacy Spanish/Galician records.
 */
export interface LocalizablePublication {
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
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  creado_en?: string;
  actualizado_en?: string;
  publicado_en?: string | null;
  cover_image_url?: string | null;
  imagen_url?: string | null;
  author?: {
    id?: string;
    full_name?: string;
    nombre?: string;
    slug?: string | null;
    avatar_url?: string | null;
  } | null;
  perfiles?: {
    nombre?: string;
    slug?: string | null;
    avatar_url?: string | null;
  } | null;
  tags?: Array<{ id?: string; name?: string; slug?: string }> | TagItem[] | null;
}

function resolveFallbackLocale(item: LocalizablePublication): string {
  return item.original_language || item.idioma_original || i18n.defaultLocale;
}

/** Resolves a publication's localized title across canonical JSONB and legacy fields. */
export function resolvePublicationTitle(item: LocalizablePublication, lang: string): string {
  const fallbackLang = resolveFallbackLocale(item);
  return (
    resolveLocalizedText(item.title, lang, fallbackLang) ||
    resolveLocalizedText({ gl: item.titulo_gl, es: item.titulo_es }, lang, fallbackLang)
  );
}

/** Resolves a publication's localized subtitle, returning null when empty. */
export function resolvePublicationSubtitle(
  item: LocalizablePublication,
  lang: string
): string | null {
  const fallbackLang = resolveFallbackLocale(item);
  return (
    resolveLocalizedText(item.subtitle, lang, fallbackLang) ||
    resolveLocalizedText({ gl: item.subtitulo_gl, es: item.subtitulo_es }, lang, fallbackLang) ||
    null
  );
}

/** Resolves a publication's localized HTML body across canonical JSONB and legacy fields. */
export function resolvePublicationContent(item: LocalizablePublication, lang: string): string {
  const fallbackLang = resolveFallbackLocale(item);
  return (
    resolveLocalizedText(item.content, lang, fallbackLang) ||
    resolveLocalizedText({ gl: item.contenido_gl, es: item.contenido_es }, lang, fallbackLang)
  );
}

/**
 * Returns a localized language badge label ONLY when the publication is monolingual
 * and the reader's active locale differs from the publication's sole language.
 */
export function resolveAlternateLocaleBadge(
  item: LocalizablePublication,
  lang: string,
  dict?: { articles?: Record<string, unknown> },
  fallbackDict: Dictionary = getDictionaryClient(lang)
): string | null {
  if (!isSupportedLocale(lang)) return null;

  const title = item.title ?? (item.titulo_gl || item.titulo_es
    ? { gl: item.titulo_gl, es: item.titulo_es }
    : undefined);
  const content = item.content ?? (item.contenido_gl || item.contenido_es
    ? { gl: item.contenido_gl, es: item.contenido_es }
    : undefined);

  const resolved = resolvePublicationLocale(
    {
      title,
      content,
      original_language: item.original_language ?? item.idioma_original,
    },
    lang
  );

  if (!resolved.isMonolingual || !resolved.isFallback) {
    return null;
  }

  const dictBadges = (dict?.articles as { languageBadge?: Record<string, string> } | undefined)
    ?.languageBadge;
  const fallbackBadges = fallbackDict.articles.languageBadge as Record<string, string> | undefined;

  return dictBadges?.[resolved.actualLocale] || fallbackBadges?.[resolved.actualLocale] || null;
}

/** Returns the subtitle or a stripped plain-text excerpt from the body content. */
export function resolvePublicationExcerpt(
  subtitle: string | null,
  rawContent: string,
  maxLength = 160
): string {
  if (subtitle) return subtitle;
  if (!rawContent) return '';
  return `${rawContent.replace(/<[^>]*>/g, '').substring(0, maxLength).trim()}...`;
}

/** Selects the best available publication timestamp across canonical and legacy columns. */
export function resolvePublicationDate(item: LocalizablePublication): string | undefined {
  return (
    item.published_at ||
    item.publicado_en ||
    item.created_at ||
    item.creado_en ||
    item.updated_at ||
    item.actualizado_en ||
    undefined
  );
}

/** Resolves a non-empty cover image URL across canonical and legacy columns. */
export function resolvePublicationCover(item: LocalizablePublication): string | null {
  const url = item.cover_image_url || item.imagen_url || null;
  return url && url.trim().length > 0 ? url : null;
}

/** Resolves author display name and avatar across canonical and legacy shapes. */
export function resolvePublicationAuthor(
  item: LocalizablePublication,
  fallbackUnknown = ''
): { name: string; avatar: string | null } {
  return {
    name:
      item.author?.full_name ||
      item.author?.nombre ||
      item.perfiles?.nombre ||
      fallbackUnknown,
    avatar: item.author?.avatar_url || item.perfiles?.avatar_url || null,
  };
}

/** Builds the localized canonical URL for a publication detail page. */
export function resolvePublicationHref(item: LocalizablePublication, lang: string): string {
  return `/${lang}/articulo/${item.slug || item.id}`;
}

/**
 * Resolves a localized publication type label, honoring caller-provided dictionary
 * overrides before falling back to the client dictionary for `lang`.
 */
export function resolvePublicationTypeLabel(
  rawType: string | undefined,
  documentTypes: Record<string, string> | undefined,
  fallbackDict: Dictionary,
  defaultType: PublicationTypeValue = PUBLICATION_TYPES.ARTICLE
): string {
  const fallbackTypes = fallbackDict.documentTypes as Record<string, string>;
  const key = (rawType || defaultType).toLowerCase().trim();
  const normalized = normalizePublicationType(key);

  if (documentTypes?.[key]) return documentTypes[key];
  if (rawType && documentTypes?.[normalized]) return documentTypes[normalized];
  if (fallbackTypes[key]) return fallbackTypes[key];
  if (fallbackTypes[normalized]) return fallbackTypes[normalized];

  return documentTypes?.[defaultType] || fallbackTypes[defaultType] || key;
}

/**
 * Resolves uppercase editorial badge labels from non-generic tags, falling back
 * to the localized publication type when no descriptive tags exist.
 */
export function resolvePublicationLabels(
  item: LocalizablePublication,
  options: {
    documentTypes?: Record<string, string>;
    fallbackDict: Dictionary;
    defaultType?: PublicationTypeValue;
    maxTags?: number;
  }
): string[] {
  const validTags = (item.tags || [])
    .map((t) => t?.name?.trim())
    .filter(
      (name): name is string =>
        Boolean(
          name &&
            name.toLowerCase() !== PUBLICATION_TYPES.NEWS &&
            name.toLowerCase() !== PUBLICATION_TYPES.ARTICLE
        )
    );

  if (validTags.length > 0) {
    const selected =
      typeof options.maxTags === 'number' ? validTags.slice(0, options.maxTags) : validTags;
    return selected.map((name) => name.toUpperCase());
  }

  const typeLabel = resolvePublicationTypeLabel(
    item.type || item.tipo,
    options.documentTypes,
    options.fallbackDict,
    options.defaultType ?? PUBLICATION_TYPES.ARTICLE
  );
  return [typeLabel.toUpperCase()];
}
