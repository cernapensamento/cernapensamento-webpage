"use server";

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import { resolveLocalizedText } from '@/lib/i18n/resolveLocalizedText';
import {
  updatePublicationStatus,
  getPublicationCards,
  getPublicationById,
  createPublication,
  updatePublication,
  syncPublicationTagsBySlugs,
  formatDbError,
  normalizePublicationType,
  canPublishDirectly,
  isReaderRole,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
  USER_ROLES,
  EDITOR_ACTIONS,
  isPublishAction,
  type PublicationStatus,
  type PublicationType,
  type PublicationTypeValue,
  type PublicationCardItem,
  type PublicationStatusValue,
  type EditorAction,
  type LocalizedString,
  type UserRole,
} from '@/lib/db';
import {
  generatePublicationSlug,
  updatePublicationSlugIfNeeded,
} from '@/lib/utils/slug';

export interface SaveArticleInput {
  id?: string;
  title: LocalizedString;
  subtitle?: LocalizedString | null;
  content: LocalizedString;
  cover_image_url?: string | null;
  tags?: string[];
  type?: PublicationTypeValue | string;
  original_language?: Locale | string;
  action: EditorAction;
  lang?: Locale | string;
}

export interface SaveArticleResult {
  success: boolean;
  id?: string;
  slug?: string;
  error?: string;
}

export interface FetchMoreArticlesInput {
  offset: number;
  limit?: number;
  type?: PublicationType;
  tagSlugs?: string[];
  searchQuery?: string;
  lang?: Locale | string;
}

export interface FetchMoreArticlesResult {
  success: boolean;
  publications: PublicationCardItem[];
  error?: string;
}

export interface UpdateArticleStateResult {
  success: boolean;
  error?: string;
}

function resolveLocale(raw?: string | null): Locale {
  return raw && isSupportedLocale(raw) ? raw : i18n.defaultLocale;
}

function revalidateArticlePaths(slug: string, oldSlug?: string | null) {
  for (const loc of i18n.locales) {
    revalidatePath(`/${loc}`);
    revalidatePath(`/${loc}/articulos`);
    revalidatePath(`/${loc}/escritorio`);
    revalidatePath(`/${loc}/articulo/${slug}`);
    if (oldSlug && oldSlug !== slug) {
      revalidatePath(`/${loc}/articulo/${oldSlug}`);
    }
  }
}

/**
 * Builds localized title payload guaranteeing a non-empty title for all configured locales.
 */
async function buildTitlePayload(inputTitle?: LocalizedString): Promise<Record<string, string>> {
  const dictPromises = i18n.locales.map(async (loc) => {
    const d = await getDictionary(loc);
    return [loc, d.articleEditor.noTitle] as const;
  });
  const fallbackEntries = await Promise.all(dictPromises);
  const fallbackTitles: Record<string, string> = Object.fromEntries(fallbackEntries);

  const payload: Record<string, string> = {};
  if (inputTitle) {
    for (const [k, v] of Object.entries(inputTitle)) {
      if (typeof v === 'string' && v.trim()) {
        payload[k] = v.trim();
      }
    }
  }

  for (const loc of i18n.locales) {
    payload[loc] = payload[loc] || fallbackTitles[loc] || fallbackTitles[i18n.defaultLocale];
  }

  return payload;
}

function buildSubtitlePayload(subtitle?: LocalizedString | null): LocalizedString | null {
  if (!subtitle) return null;
  const hasText = Object.values(subtitle).some((v) => Boolean(v && v.trim().length > 0));
  if (!hasText) return null;

  const result: Record<string, string> = {};
  for (const loc of i18n.locales) {
    result[loc] = subtitle[loc] || '';
  }
  return { ...result, ...subtitle };
}

function buildContentPayload(content?: LocalizedString): LocalizedString {
  const result: Record<string, string> = {};
  for (const loc of i18n.locales) {
    result[loc] = content?.[loc] || '';
  }
  return { ...result, ...content };
}

function resolveTargetStatus(action: EditorAction, canDirectPublish: boolean): PublicationStatusValue {
  if (isPublishAction(action)) {
    return canDirectPublish ? PUBLICATION_STATUSES.PUBLISHED : PUBLICATION_STATUSES.DRAFT;
  }
  if (action === EDITOR_ACTIONS.SUBMIT_APPROVAL) {
    return PUBLICATION_STATUSES.IN_REVIEW;
  }
  return PUBLICATION_STATUSES.DRAFT;
}

async function syncTagsSafe(publicationId: string, tags: string[]): Promise<void> {
  const { error } = await syncPublicationTagsBySlugs(publicationId, tags);
  if (error) {
    console.warn('[Action:saveArticle] Error syncing tags:', formatDbError(error));
  }
}

/**
 * Server Action for creating and editing publications with authoritative role checks,
 * transactional tag synchronization, and Next.js bilingual cache revalidation.
 */
export async function saveArticleAction(
  input: SaveArticleInput
): Promise<SaveArticleResult> {
  const locale = resolveLocale(input.lang);
  const dict = await getDictionary(locale);
  const edDict = dict.articleEditor;

  try {
    const { user, profile } = await getAuthenticatedUser();
    if (!user || !profile) {
      return { success: false, error: edDict.unauthorized };
    }

    const userRole: UserRole = profile.role || USER_ROLES.READER;
    if (isReaderRole(userRole)) {
      return { success: false, error: edDict.insufficientRole };
    }

    const canDirectPublish = canPublishDirectly(userRole);
    if (isPublishAction(input.action) && !canDirectPublish) {
      return { success: false, error: edDict.onlyPrivilegedCanPublish };
    }

    const targetStatus = resolveTargetStatus(input.action, canDirectPublish);
    const origLang = resolveLocale(input.original_language);
    const currentTitle =
      resolveLocalizedText(input.title, origLang) ||
      Object.values(input.title || {}).find((v) => Boolean(v?.trim())) ||
      '';
    const pubType = normalizePublicationType(input.type);

    const titlePayload = await buildTitlePayload(input.title);
    const subtitlePayload = buildSubtitlePayload(input.subtitle);
    const contentPayload = buildContentPayload(input.content);

    let finalId: string;
    let finalSlug: string;
    let oldSlug: string | null = null;

    if (input.id) {
      // --- UPDATE EXISTING PUBLICATION ---
      const existing = await getPublicationById(input.id);
      if (!existing) {
        return { success: false, error: edDict.publicationNotFound };
      }

      const isAuthor = existing.author.id === user.id;
      if (!isAuthor && !canDirectPublish) {
        return { success: false, error: edDict.notAuthorOrPrivileged };
      }

      const isDraft = existing.status === PUBLICATION_STATUSES.DRAFT;
      finalSlug = updatePublicationSlugIfNeeded(currentTitle, existing.slug, isDraft);
      oldSlug = existing.slug;
      finalId = input.id;

      const targetPublishedAt =
        targetStatus === PUBLICATION_STATUSES.PUBLISHED
          ? existing.published_at || new Date().toISOString()
          : null;

      const updatePayload = {
        [PUBLICATION_COLS.TITLE]: titlePayload,
        [PUBLICATION_COLS.SUBTITLE]: subtitlePayload,
        [PUBLICATION_COLS.SLUG]: finalSlug,
        [PUBLICATION_COLS.CONTENT]: contentPayload,
        [PUBLICATION_COLS.COVER_IMAGE_URL]: input.cover_image_url || null,
        [PUBLICATION_COLS.STATUS]: targetStatus,
        [PUBLICATION_COLS.PUBLISHED_AT]: targetPublishedAt,
        [PUBLICATION_COLS.UPDATED_AT]: new Date().toISOString(),
        [PUBLICATION_COLS.TYPE]: pubType,
        [PUBLICATION_COLS.ORIGINAL_LANGUAGE]: origLang,
      };

      const { error: updateError } = await updatePublication(input.id, updatePayload);
      if (updateError) {
        console.warn('[Action:saveArticle] Failed to update publication:', formatDbError(updateError));
        return { success: false, error: updateError.message || edDict.createDbError };
      }
    } else {
      // --- CREATE NEW PUBLICATION ---
      finalSlug = generatePublicationSlug(currentTitle);
      const publishedAt =
        targetStatus === PUBLICATION_STATUSES.PUBLISHED ? new Date().toISOString() : null;

      const insertPayload = {
        [PUBLICATION_COLS.TITLE]: titlePayload,
        [PUBLICATION_COLS.SUBTITLE]: subtitlePayload,
        [PUBLICATION_COLS.SLUG]: finalSlug,
        [PUBLICATION_COLS.CONTENT]: contentPayload,
        [PUBLICATION_COLS.AUTHOR_ID]: user.id,
        [PUBLICATION_COLS.COVER_IMAGE_URL]: input.cover_image_url || null,
        [PUBLICATION_COLS.STATUS]: targetStatus,
        [PUBLICATION_COLS.PUBLISHED_AT]: publishedAt,
        [PUBLICATION_COLS.TYPE]: pubType,
        [PUBLICATION_COLS.ORIGINAL_LANGUAGE]: origLang,
      };

      const { data: inserted, error: insertError } = await createPublication(insertPayload);
      if (insertError || !inserted) {
        console.warn('[Action:saveArticle] Failed to create publication:', formatDbError(insertError));
        return {
          success: false,
          error: insertError?.message || edDict.createDbError,
        };
      }
      finalId = inserted.id;
    }

    // Consolidated tag sync and path revalidation
    if (input.tags !== undefined) {
      await syncTagsSafe(finalId, input.tags);
    }

    revalidateArticlePaths(finalSlug, oldSlug);
    return { success: true, id: finalId, slug: finalSlug };
  } catch (err: unknown) {
    console.error('[Action:saveArticle] Unexpected error:', formatDbError(err));
    const message = err instanceof Error ? err.message : edDict.serverError;
    return { success: false, error: message };
  }
}

/**
 * Loads another page of published cards, defaulting to 10 items from the supplied
 * zero-based offset. DAL failures normally produce a successful empty page;
 * exceptions reaching this action return `success: false` with an empty list and localized error.
 */
export async function fetchMoreArticlesAction(
  options: FetchMoreArticlesInput
): Promise<FetchMoreArticlesResult> {
  try {
    const publications = await getPublicationCards({
      offset: options.offset,
      limit: options.limit ?? 10,
      type: options.type,
      tagSlugs: options.tagSlugs,
      searchQuery: options.searchQuery,
      lang: options.lang,
    });
    return { success: true, publications };
  } catch (err: unknown) {
    console.warn('[Action:fetchMoreArticles] Failed:', formatDbError(err));
    const locale = resolveLocale(options.lang);
    const dict = await getDictionary(locale);
    return { success: false, publications: [], error: dict.articleEditor.fetchMoreError };
  }
}

/**
 * Updates the publication status (e.g. approve to published, or reject to draft)
 * with role-gated editorial checks and bilingual path revalidation.
 */
export async function updateArticleState(
  publicationId: string,
  newState: PublicationStatus,
  lang: Locale = i18n.defaultLocale
): Promise<UpdateArticleStateResult> {
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);
  const edDict = dict.articleEditor;

  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || !role) {
      return { success: false, error: edDict.unauthorized };
    }

    if (!canPublishDirectly(role)) {
      return { success: false, error: edDict.onlyPrivilegedCanPublish };
    }

    const validStatuses = Object.values(PUBLICATION_STATUSES) as string[];
    if (!validStatuses.includes(newState)) {
      return { success: false, error: edDict.statusUpdateError };
    }

    const { success, error } = await updatePublicationStatus(
      publicationId,
      newState
    );

    if (error || !success) {
      console.warn('[Action:updateArticleState] Error updating status:', formatDbError(error));
      return { success: false, error: error?.message || edDict.statusUpdateError };
    }

    for (const loc of i18n.locales) {
      revalidatePath(`/${loc}`);
      revalidatePath(`/${loc}/articulos`);
      revalidatePath(`/${loc}/escritorio`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Action:updateArticleState] Unexpected error:', formatDbError(err));
    const message = err instanceof Error ? err.message : edDict.serverError;
    return { success: false, error: message };
  }
}
