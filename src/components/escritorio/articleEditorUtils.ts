import type { SupabaseClient } from '@supabase/supabase-js';
import type { Editor } from '@tiptap/react';
import type { TableOfContentData } from '@tiptap/extension-table-of-contents';
import type { ArticleTableOfContentsItem } from '@/components/features/ArticleTableOfContents';
import type { Dictionary } from '@/dictionaries/client';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import type { PublicationLanguageMode } from '@/lib/i18n/publicationLanguage';
import { PUBLICATION_TYPES } from '@/lib/db/schema';
import type { LocalizedString } from '@/lib/db/types';
import {
  getHeadingsFromHtml,
  stripIndex,
  buildHierarchicalHeadings,
  stripHeadingNumbering,
  slugifyHeading,
} from '@/lib/editor/generateIndex';
import {
  uploadStorageImage,
  extractInlineStoragePaths,
  extractStoragePathFromUrl,
  STORAGE_CATEGORIES,
} from '@/lib/storage';

export type LocalizedFieldMap = Record<Locale, string>;

const VALID_PUBLICATION_TYPES: readonly string[] = Object.values(PUBLICATION_TYPES);

/**
 * Creates a localized string map initialized with empty strings for every configured locale.
 */
export function createEmptyLocalizedMap(): LocalizedFieldMap {
  return Object.fromEntries(i18n.locales.map((loc) => [loc, ''])) as LocalizedFieldMap;
}

/**
 * Builds a complete locale-keyed map from a canonical LocalizedString object and optional
 * legacy flat values per locale, optionally transforming non-empty values.
 */
export function buildLocalizedMap(
  localized?: LocalizedString | null,
  legacyByLocale?: Partial<Record<Locale, string>>,
  transform: (val: string) => string = (val) => val
): LocalizedFieldMap {
  return Object.fromEntries(
    i18n.locales.map((loc) => {
      const raw = localized?.[loc] || legacyByLocale?.[loc] || '';
      return [loc, raw ? transform(raw) : ''];
    })
  ) as LocalizedFieldMap;
}

/**
 * Builds hierarchical Table of Contents items from TipTap's live ToC data,
 * falling back to HTML heading parsing when live data is empty.
 */
export function buildLiveTocItems(
  tocData: TableOfContentData,
  fallbackHtml: string
): ArticleTableOfContentsItem[] {
  if (tocData.length === 0) {
    return getHeadingsFromHtml(fallbackHtml);
  }

  const seen = new Map<string, number>();
  const entries = tocData
    .map((item) => {
      const rawText = item.textContent.replace(/\s+/g, ' ').trim();
      if (!rawText) return null;
      const text = stripHeadingNumbering(rawText) || rawText;
      const baseSlug = slugifyHeading(rawText) || slugifyHeading(text) || item.id;
      const count = seen.get(baseSlug) ?? 0;
      seen.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
      return {
        entry: {
          level: Math.min(Math.max(item.originalLevel, 1), 3) as 1 | 2 | 3,
          text,
          slug: slug as ReturnType<typeof slugifyHeading>,
        },
        id: item.id,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const hierarchical = buildHierarchicalHeadings(entries.map((e) => e.entry));
  return hierarchical.map((item, idx) => ({
    ...item,
    id: entries[idx]?.id,
  }));
}

/**
 * Resolves a localized user-facing error message for image upload failures.
 */
export function getStorageUploadErrorMessage(
  err: unknown,
  storageDict: Dictionary['escritorio']['storage'],
  fallbackError: string
): string {
  const errorMsg = err instanceof Error ? err.message : '';
  if (errorMsg === 'INVALID_FORMAT') {
    return storageDict.invalidFormat;
  }
  if (errorMsg.startsWith('FILE_TOO_LARGE:')) {
    const maxMb = errorMsg.split(':')[1] || '8';
    return storageDict.fileTooLarge.replace('{max}', maxMb);
  }
  return storageDict.uploadError.replace('{error}', errorMsg || fallbackError);
}

/**
 * Removes any figure node from the TipTap document whose src matches the supplied URL.
 */
export function removeFigureBySrc(editor: Editor, src: string): void {
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'figure' && node.attrs.src === src) {
      editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
      return false;
    }
    return true;
  });
}

/**
 * Converts embedded base64 data-URI images into uploaded WebP storage assets.
 */
export async function sanitizeBase64Images(
  html: string,
  userId: string,
  supabase: SupabaseClient,
  onUploadedUrl: (url: string) => void
): Promise<string> {
  if (!html || !html.includes(';base64,')) return html;
  const base64Regex = /data:image\/([a-zA-Z0-9]+);base64,([A-Za-z0-9+/=]+)/g;
  const matches: { fullMatch: string; format: string; base64Data: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = base64Regex.exec(html)) !== null) {
    matches.push({ fullMatch: match[0], format: match[1], base64Data: match[2] });
  }

  let cleaned = html;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    try {
      const byteCharacters = atob(m.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let j = 0; j < byteCharacters.length; j++) {
        byteNumbers[j] = byteCharacters.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: `image/${m.format === 'jpg' ? 'jpeg' : m.format}`,
      });
      const { publicUrl } = await uploadStorageImage({
        supabase,
        file: blob,
        category: STORAGE_CATEGORIES.PUBLICATION_INLINE,
        userId,
        originalFilename: `pasted-${i}`,
      });
      cleaned = cleaned.replace(m.fullMatch, publicUrl);
      onUploadedUrl(publicUrl);
    } catch (err) {
      console.error('Error uploading pasted base64 image:', err);
    }
  }
  return cleaned;
}

/**
 * Computes the deduplicated list of storage paths superseded by a save operation
 * (removed inline images, replaced saved cover, and discarded intermediate uploads).
 */
export function collectSupersededStoragePaths({
  initialContents,
  finalContents,
  uploadedInlineUrls,
  savedCoverUrl,
  currentCoverUrl,
  uploadedCoverUrls,
}: {
  initialContents: LocalizedFieldMap;
  finalContents: LocalizedFieldMap;
  uploadedInlineUrls: string[];
  savedCoverUrl: string | null;
  currentCoverUrl: string;
  uploadedCoverUrls: string[];
}): string[] {
  const oldInlinePaths = i18n.locales.flatMap((loc) =>
    extractInlineStoragePaths(initialContents[loc])
  );
  const newInlinePaths = new Set(
    i18n.locales.flatMap((loc) => extractInlineStoragePaths(finalContents[loc]))
  );
  const uploadedInlinePaths = uploadedInlineUrls
    .map((url) => extractStoragePathFromUrl(url))
    .filter((p): p is string => Boolean(p));

  const inlinePathsToDelete = [
    ...oldInlinePaths.filter((p) => !newInlinePaths.has(p)),
    ...uploadedInlinePaths.filter((p) => !newInlinePaths.has(p)),
  ];

  const savedCoverPath = extractStoragePathFromUrl(savedCoverUrl);
  const newCoverPath = extractStoragePathFromUrl(currentCoverUrl);
  const uploadedCoverPaths = uploadedCoverUrls
    .map((url) => extractStoragePathFromUrl(url))
    .filter((p): p is string => Boolean(p));

  const coverPathsToDelete = [
    ...(savedCoverPath && savedCoverPath !== newCoverPath ? [savedCoverPath] : []),
    ...uploadedCoverPaths.filter((p) => p !== newCoverPath),
  ];

  return Array.from(new Set([...inlinePathsToDelete, ...coverPathsToDelete]));
}

export interface DraftPayload {
  title: LocalizedFieldMap;
  subtitle: LocalizedFieldMap;
  content: LocalizedFieldMap;
  cover_image_url: string;
  tags: string[];
  type: string;
  original_language: Locale;
  language_mode?: PublicationLanguageMode;
  show_index: boolean;
}

export interface ParsedDraftPatch {
  titles: Partial<LocalizedFieldMap>;
  subtitles: Partial<LocalizedFieldMap>;
  contents: Partial<LocalizedFieldMap>;
  coverImageUrl?: string;
  tags?: string[];
  type?: string;
  originalLanguage?: Locale;
  languageMode?: PublicationLanguageMode;
  showIndex?: boolean;
}

function getLegacyDraftKey(prefix: 'titulo' | 'subtitulo' | 'contenido', loc: Locale): string {
  return `${prefix}${loc.charAt(0).toUpperCase()}${loc.slice(1)}`;
}

function extractLocalizedDraftPatch(
  raw: Record<string, unknown>,
  canonicalKey: 'title' | 'subtitle' | 'content',
  legacyPrefix: 'titulo' | 'subtitulo' | 'contenido',
  transform?: (val: string) => string
): Partial<LocalizedFieldMap> {
  const result: Partial<LocalizedFieldMap> = {};
  const canonicalObj =
    raw[canonicalKey] && typeof raw[canonicalKey] === 'object'
      ? (raw[canonicalKey] as Record<string, unknown>)
      : null;

  for (const loc of i18n.locales) {
    const canonicalVal = canonicalObj?.[loc];
    const legacyVal = raw[getLegacyDraftKey(legacyPrefix, loc)];
    if (typeof canonicalVal === 'string') {
      result[loc] = transform ? transform(canonicalVal) : canonicalVal;
    } else if (typeof legacyVal === 'string' && legacyVal.length > 0) {
      result[loc] = transform ? transform(legacyVal) : legacyVal;
    }
  }
  return result;
}

/**
 * Serializes editor draft state into canonical locale-keyed JSON for localStorage.
 */
export function serializeDraft(draft: DraftPayload): string {
  return JSON.stringify(draft);
}

/**
 * Parses a localStorage draft string, supporting both canonical locale-keyed payloads
 * and legacy flat Galician/Spanish draft keys.
 */
export function parseDraft(rawJson: string): ParsedDraftPatch | null {
  try {
    const raw = JSON.parse(rawJson) as Record<string, unknown>;
    if (!raw || typeof raw !== 'object') return null;

    const rawType = raw.type ?? raw.tipo;
    const rawOrigLang = raw.original_language ?? raw.idioma_original;
    const rawCover = raw.cover_image_url ?? raw.imagen_url;
    const rawTags = raw.tags ?? raw.tematicas;

    return {
      titles: extractLocalizedDraftPatch(raw, 'title', 'titulo'),
      subtitles: extractLocalizedDraftPatch(raw, 'subtitle', 'subtitulo'),
      contents: extractLocalizedDraftPatch(raw, 'content', 'contenido', stripIndex),
      coverImageUrl:
        typeof rawCover === 'string' && rawCover.length > 0 ? rawCover : undefined,
      tags: Array.isArray(rawTags)
        ? rawTags.filter((t): t is string => typeof t === 'string')
        : undefined,
      type:
        typeof rawType === 'string' && VALID_PUBLICATION_TYPES.includes(rawType)
          ? rawType
          : undefined,
      originalLanguage: isSupportedLocale(rawOrigLang) ? rawOrigLang : undefined,
      languageMode:
        raw.language_mode === 'bilingual' || raw.language_mode === 'monolingual'
          ? raw.language_mode
          : undefined,
      showIndex: typeof raw.show_index === 'boolean' ? raw.show_index : undefined,
    };
  } catch (err) {
    console.error('Error parseando borrador', err);
    return null;
  }
}

/**
 * Smoothly scrolls the preview modal container to the heading matching a hash link.
 */
export function scrollToPreviewHeading(container: HTMLElement | null, hash: string): void {
  if (!container || !hash.startsWith('#')) return;
  try {
    const id = decodeURIComponent(hash.slice(1));
    const stripped = id.replace(/^\d+(?:-\d+)*-/, '');
    let element = container.querySelector(`[id="${CSS.escape(id)}"]`) as HTMLElement | null;
    if (!element && stripped && stripped !== id) {
      element = container.querySelector(`[id="${CSS.escape(stripped)}"]`) as HTMLElement | null;
    }
    if (!element) {
      const targets = container.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], span[id]');
      for (let i = 0; i < targets.length; i++) {
        const candidate = targets[i];
        const tId = candidate.id;
        if (
          tId === id ||
          tId === stripped ||
          tId.replace(/^\d+(?:-\d+)*-/, '') === stripped ||
          tId.endsWith(`-${stripped}`) ||
          tId.endsWith(`-${id}`)
        ) {
          element = candidate;
          break;
        }
      }
    }
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const headerOffset = 110;
      const targetScrollTop =
        container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  } catch {
    // Ignore malformed URI hashes in preview links
  }
}
