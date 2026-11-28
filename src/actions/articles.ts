"use server";

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getDictionary } from '@/dictionaries';
import { i18n, isSupportedLocale, type Locale } from '@/i18n-config';
import {
  hasMeaningfulHtmlContent,
  type PublicationLanguageMode,
} from '@/lib/i18n/publicationLanguage';
import {
  updatePublicationStatus,
  getPublicationCards,
  getPublicationById,
  getPublicationAssetsForCleanup,
  deletePublication,
  createPublication,
  updatePublication,
  syncPublicationTagsBySlugs,
  formatDbError,
  normalizePublicationType,
  hasPermission,
  hasAnyPermission,
  PERMISSIONS,
  PUBLICATION_COLS,
  PUBLICATION_STATUSES,
  EDITOR_ACTIONS,
  isPublishAction,
  type PermissionValue,
  type PublicationStatus,
  type PublicationType,
  type PublicationTypeValue,
  type PublicationCardItem,
  type PublicationStatusValue,
  type EditorAction,
  type LocalizedString,
} from '@/lib/db';
import {
  generatePublicationSlug,
  updatePublicationSlugIfNeeded,
} from '@/lib/utils/slug';
import { stripIndex } from '@/lib/editor/generateIndex';
import {
  cleanupPublicationImages,
  sweepPublicationStorageFolder,
  extractBucketAndPathFromUrl,
  STORAGE_BUCKET,
} from '@/lib/storage';

export interface SaveArticleInput {
  id?: string;
  title: LocalizedString;
  subtitle?: LocalizedString | null;
  content: LocalizedString;
  cover_image_url?: string | null;
  tags?: string[];
  type?: PublicationTypeValue | string;
  original_language?: Locale | string;
  language_mode?: PublicationLanguageMode;
  show_index?: boolean;
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

function resolveLanguageMode(raw?: PublicationLanguageMode): PublicationLanguageMode {
  return raw === 'monolingual' ? 'monolingual' : 'bilingual';
}

function getLocaleDisplayName(loc: Locale, edDict: { galician: string; spanish: string }): string {
  return loc === 'gl' ? edDict.galician : edDict.spanish;
}

/**
 * Builds localized title payload containing only non-empty trimmed titles for active locales.
 * Never injects placeholder strings such as "Sen Título" / "Sin Título".
 */
function buildTitlePayload(
  inputTitle: LocalizedString | undefined,
  activeLocales: readonly Locale[]
): Record<string, string> {
  const payload: Record<string, string> = {};
  if (!inputTitle) return payload;

  for (const loc of activeLocales) {
    const val = inputTitle[loc];
    if (typeof val === 'string' && val.trim().length > 0) {
      payload[loc] = val.trim();
    }
  }
  return payload;
}

function buildSubtitlePayload(
  subtitle: LocalizedString | null | undefined,
  activeLocales: readonly Locale[]
): LocalizedString | null {
  if (!subtitle) return null;

  const result: Record<string, string> = {};
  for (const loc of activeLocales) {
    const val = subtitle[loc];
    if (typeof val === 'string' && val.trim().length > 0) {
      result[loc] = val.trim();
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function buildContentPayload(
  content: LocalizedString | undefined,
  activeLocales: readonly Locale[]
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!content) return result;

  for (const loc of activeLocales) {
    const raw = content[loc];
    if (typeof raw === 'string') {
      const cleaned = stripIndex(raw);
      if (hasMeaningfulHtmlContent(cleaned)) {
        result[loc] = cleaned;
      }
    }
  }
  return result;
}

function resolveTargetStatus(action: EditorAction): PublicationStatusValue {
  if (isPublishAction(action)) {
    return PUBLICATION_STATUSES.PUBLISHED;
  }
  if (action === EDITOR_ACTIONS.SUBMIT_APPROVAL) {
    return PUBLICATION_STATUSES.IN_REVIEW;
  }
  return PUBLICATION_STATUSES.DRAFT;
}

function canEditPublication(
  permissions: readonly PermissionValue[],
  existing: { author: { id: string }; status: PublicationStatusValue },
  userId: string
): boolean {
  const isAuthor = existing.author.id === userId;
  const isPublished = existing.status === PUBLICATION_STATUSES.PUBLISHED;
  const isInReview = existing.status === PUBLICATION_STATUSES.IN_REVIEW;
  const canUpdateAny = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_ANY);
  const canUpdateOwn = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_OWN);
  const canPublish = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_PUBLISH);
  const canReview = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_REVIEW);

  if (isAuthor) {
    return isPublished
      ? canPublish || canUpdateAny
      : canUpdateOwn || canUpdateAny || (isInReview && canReview);
  }

  return canUpdateAny || (isInReview && canReview);
}

async function syncTagsSafe(publicationId: string, tags: string[]): Promise<void> {
  const { error } = await syncPublicationTagsBySlugs(publicationId, tags);
  if (error) {
    console.warn('[Action:saveArticle] Error syncing tags:', formatDbError(error));
  }
}

/**
 * Server Action for creating and editing publications with atomic permission checks,
 * transactional tag synchronization, and Next.js bilingual cache revalidation.
 */
export async function saveArticleAction(
  input: SaveArticleInput
): Promise<SaveArticleResult> {
  const locale = resolveLocale(input.lang);
  const dict = await getDictionary(locale);
  const edDict = dict.articleEditor;

  try {
    const { user, profile, permissions } = await getAuthenticatedUser();
    if (!user || !profile) {
      return { success: false, error: edDict.unauthorized };
    }

    const canCreate = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_CREATE);
    const canPublish = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_PUBLISH);
    const canReview = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_REVIEW);
    const canUpdateAny = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_ANY);
    const canMutateExisting = hasAnyPermission(permissions, [
      PERMISSIONS.PUBLICATIONS_UPDATE_OWN,
      PERMISSIONS.PUBLICATIONS_UPDATE_ANY,
      PERMISSIONS.PUBLICATIONS_PUBLISH,
      PERMISSIONS.PUBLICATIONS_REVIEW,
    ]);

    let existing: Awaited<ReturnType<typeof getPublicationById>> = null;
    if (input.id) {
      if (!canMutateExisting) {
        return { success: false, error: edDict.insufficientRole };
      }

      existing = await getPublicationById(input.id);
      if (!existing) {
        return { success: false, error: edDict.publicationNotFound };
      }

      if (!canEditPublication(permissions, existing, user.id)) {
        return { success: false, error: edDict.notAuthorOrPrivileged };
      }

      const isInReview = existing.status === PUBLICATION_STATUSES.IN_REVIEW;
      const isAlreadyPublished = existing.status === PUBLICATION_STATUSES.PUBLISHED;
      if (isPublishAction(input.action)) {
        const canPublishThis =
          isAlreadyPublished ||
          (input.action === EDITOR_ACTIONS.APPROVE
            ? canPublish || (isInReview && canReview)
            : canPublish);
        if (!canPublishThis) {
          return { success: false, error: edDict.onlyPrivilegedCanPublish };
        }
      } else if (
        input.action === EDITOR_ACTIONS.REJECT &&
        (!isInReview || (!canReview && !canUpdateAny))
      ) {
        return { success: false, error: edDict.onlyPrivilegedCanPublish };
      }
    } else {
      if (!canCreate) {
        return { success: false, error: edDict.insufficientRole };
      }
      if (isPublishAction(input.action) && !canPublish) {
        return { success: false, error: edDict.onlyPrivilegedCanPublish };
      }
    }

    const targetStatus = resolveTargetStatus(input.action);
    const languageMode = resolveLanguageMode(input.language_mode);
    const origLang = resolveLocale(input.original_language);
    const activeLocales: readonly Locale[] =
      languageMode === 'monolingual' ? [origLang] : i18n.locales;
    const pubType = normalizePublicationType(input.type);

    const titlePayload = buildTitlePayload(input.title, activeLocales);
    const subtitlePayload = buildSubtitlePayload(input.subtitle, activeLocales);
    const contentPayload = buildContentPayload(input.content, activeLocales);

    if (targetStatus === PUBLICATION_STATUSES.DRAFT) {
      const hasAnyDraftData = activeLocales.some(
        (loc) => Boolean(titlePayload[loc]) || Boolean(contentPayload[loc])
      );
      if (!hasAnyDraftData) {
        return { success: false, error: edDict.validationEmptyDraft };
      }
    } else {
      const incompleteLocales = activeLocales.filter(
        (loc) => !titlePayload[loc] || !contentPayload[loc]
      );
      if (incompleteLocales.length > 0) {
        if (languageMode === 'monolingual') {
          const langName = getLocaleDisplayName(origLang, edDict);
          return {
            success: false,
            error: edDict.validationMissingMonolingual.replace('{language}', langName),
          };
        }
        const missingNames = incompleteLocales
          .map((loc) => getLocaleDisplayName(loc, edDict))
          .join(', ');
        return {
          success: false,
          error: edDict.validationMissingBilingual.replace('{languages}', missingNames),
        };
      }
    }

    const currentTitle =
      titlePayload[origLang] ||
      Object.values(titlePayload)[0] ||
      '';
    const showIndex = Boolean(input.show_index);

    let finalId: string;
    let finalSlug: string;
    let oldSlug: string | null = null;

    if (input.id && existing) {
      // --- UPDATE EXISTING PUBLICATION ---
      const isDraft = existing.status === PUBLICATION_STATUSES.DRAFT;
      finalSlug = updatePublicationSlugIfNeeded(currentTitle, existing.slug, isDraft);
      oldSlug = existing.slug;
      finalId = input.id;

      const wasAlreadyPublished = existing.status === PUBLICATION_STATUSES.PUBLISHED;
      const targetPublishedAt =
        targetStatus === PUBLICATION_STATUSES.PUBLISHED
          ? (wasAlreadyPublished && existing.published_at) || new Date().toISOString()
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
        [PUBLICATION_COLS.SHOW_INDEX]: showIndex,
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
        [PUBLICATION_COLS.SHOW_INDEX]: showIndex,
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
 * with atomic permission checks and bilingual path revalidation.
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
    const { user, permissions } = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: edDict.unauthorized };
    }

    const validStatuses = Object.values(PUBLICATION_STATUSES) as string[];
    if (!validStatuses.includes(newState)) {
      return { success: false, error: edDict.statusUpdateError };
    }

    const canReview = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_REVIEW);
    const canPublish = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_PUBLISH);
    const canUpdateAny = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_UPDATE_ANY);

    if (!canReview && !canPublish && !canUpdateAny) {
      return { success: false, error: edDict.onlyPrivilegedCanPublish };
    }

    const existing = await getPublicationById(publicationId);
    if (!existing) {
      return { success: false, error: edDict.publicationNotFound };
    }

    const isAuthor = existing.author.id === user.id;
    const isInReview = existing.status === PUBLICATION_STATUSES.IN_REVIEW;
    const canTransition =
      canUpdateAny ||
      (isInReview && canReview) ||
      (isAuthor && canPublish);

    if (!canTransition) {
      return { success: false, error: edDict.onlyPrivilegedCanPublish };
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

export interface DeleteArticleResult {
  success: boolean;
  error?: string;
}

function createStorageSweepClient(fallback: SupabaseClient): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return fallback;
  }
  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const INLINE_IMG_TAG_REGEX = /<img\b[^>]*\ssrc=(["'])([^"']+)\1[^>]*>/gi;

function isOwnedPublicationAssetUrl(
  url: string,
  publicationId: string,
  authorId: string | null
): boolean {
  const safePubId = publicationId.trim();
  if (!safePubId) return false;

  const extracted = extractBucketAndPathFromUrl(url);
  if (!extracted) return false;

  const { bucket, path } = extracted;
  if (path.includes('..') || bucket !== STORAGE_BUCKET) return false;

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  // Canonical entity-grouped paths under publications/{publicationId}/... in primary bucket
  if (
    segments.length >= 3 &&
    segments[0] === 'publications' &&
    segments[1] === safePubId &&
    safePubId !== 'covers' &&
    safePubId !== 'inline'
  ) {
    return true;
  }

  // Legacy author-scoped paths under media require strict author_id match
  if (!authorId) {
    return false;
  }

  // publications/covers/{authorId}/... or publications/inline/{authorId}/...
  if (
    segments.length >= 4 &&
    segments[0] === 'publications' &&
    (segments[1] === 'covers' || segments[1] === 'inline') &&
    segments[2] === authorId
  ) {
    return true;
  }

  return false;
}

function filterOwnedPublicationInlineHtml(
  html: string | null | undefined,
  publicationId: string,
  authorId: string | null
): string | null {
  if (!html || typeof html !== 'string') return null;

  let hasOwnedImg = false;
  const filtered = html.replace(INLINE_IMG_TAG_REGEX, (fullTag, _quote: string, src: string) => {
    if (isOwnedPublicationAssetUrl(src, publicationId, authorId)) {
      hasOwnedImg = true;
      return fullTag;
    }
    return '';
  });

  return hasOwnedImg ? filtered : null;
}

/**
 * Deletes a publication using the caller's authenticated Supabase SSR client first
 * (preserving PostgreSQL RLS so writers cannot delete published articles or others' drafts),
 * and only after DB deletion succeeds sweeps the entire `publications/{publicationId}/`
 * storage folder plus any owned legacy asset references, then revalidates localized paths.
 */
export async function deleteArticleAction(
  publicationId: string,
  lang: Locale | string = i18n.defaultLocale
): Promise<DeleteArticleResult> {
  const locale = resolveLocale(lang);
  const dict = await getDictionary(locale);
  const edDict = dict.articleEditor;

  try {
    const { user, profile, permissions } = await getAuthenticatedUser();
    if (!user || !profile) {
      return { success: false, error: edDict.unauthorized };
    }

    const canDeleteAny = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_DELETE_ANY);
    const canDeleteOwn = hasPermission(permissions, PERMISSIONS.PUBLICATIONS_DELETE_OWN);
    if (!canDeleteAny && !canDeleteOwn) {
      return { success: false, error: edDict.insufficientRole };
    }

    const supabase = await createServerSupabaseClient();
    const pubAssets = await getPublicationAssetsForCleanup(publicationId, supabase);

    if (!canDeleteAny) {
      if (pubAssets?.author_id && pubAssets.author_id !== user.id) {
        return { success: false, error: edDict.notAuthorOrPrivileged };
      }

      const existing = await getPublicationById(publicationId, { client: supabase });
      if (existing) {
        if (existing.author.id !== user.id) {
          return { success: false, error: edDict.notAuthorOrPrivileged };
        }
        if (existing.status === PUBLICATION_STATUSES.PUBLISHED) {
          return { success: false, error: edDict.insufficientRole };
        }
      }
    }

    const { success, error } = await deletePublication(publicationId, supabase);
    if (!success || error) {
      console.warn('[Action:deleteArticle] Failed to delete publication:', formatDbError(error));
      const errMsg = error ? formatDbError(error) : '';
      return {
        success: false,
        error: errMsg || dict.dashboard.deleteError,
      };
    }

    const storageClient = createStorageSweepClient(supabase);
    try {
      await sweepPublicationStorageFolder(storageClient, publicationId);
    } catch (sweepErr: unknown) {
      console.error('[Action:deleteArticle] Failed to sweep publication folder:', formatDbError(sweepErr));
    }

    if (pubAssets) {
      const safeCoverUrl =
        pubAssets.cover_image_url &&
        isOwnedPublicationAssetUrl(pubAssets.cover_image_url, publicationId, pubAssets.author_id)
          ? pubAssets.cover_image_url
          : null;
      const safeContentGl = filterOwnedPublicationInlineHtml(
        pubAssets.content?.gl,
        publicationId,
        pubAssets.author_id
      );
      const safeContentEs = filterOwnedPublicationInlineHtml(
        pubAssets.content?.es,
        publicationId,
        pubAssets.author_id
      );

      if (safeCoverUrl || safeContentGl || safeContentEs) {
        try {
          await cleanupPublicationImages(storageClient, {
            coverUrl: safeCoverUrl,
            contentGl: safeContentGl,
            contentEs: safeContentEs,
          });
        } catch (cleanupErr: unknown) {
          console.error('[Action:deleteArticle] Failed to cleanup publication images:', formatDbError(cleanupErr));
        }
      }
    }

    for (const loc of i18n.locales) {
      revalidatePath(`/${loc}`);
      revalidatePath(`/${loc}/articulos`);
      revalidatePath(`/${loc}/escritorio`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Action:deleteArticle] Unexpected error:', formatDbError(err));
    const message = err instanceof Error ? err.message : edDict.serverError;
    return { success: false, error: message };
  }
}
