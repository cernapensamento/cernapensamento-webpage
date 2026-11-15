"use server";

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDictionary } from '@/dictionaries';
import { i18n, type Locale } from '@/i18n-config';
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
} from '@/lib/db';
import {
  generatePublicationSlug,
  updatePublicationSlugIfNeeded,
} from '@/lib/utils/slug';
import { stripIndex } from '@/lib/editor/generateIndex';

export interface SaveArticleInput {
  id?: string;
  title: LocalizedString;
  subtitle?: LocalizedString | null;
  content: LocalizedString;
  cover_image_url?: string | null;
  tags?: string[];
  type?: PublicationTypeValue | string;
  original_language?: Locale | string;
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

/**
 * Resolves a raw or optional locale to a supported platform Locale ('gl' | 'es').
 */
function resolveLocale(raw?: string | null): Locale {
  return raw === 'es' ? 'es' : i18n.defaultLocale;
}

/**
 * Revalidates public and editorial routes for all platform locales
 * so content updates immediately reflect across both Galician and Spanish caches.
 */
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
 * Server Action for creating and editing publications with authoritative role checks,
 * transactional tag synchronization, and Next.js bilingual cache revalidation.
 */
export async function saveArticleAction(
  input: SaveArticleInput
): Promise<SaveArticleResult> {
  const locale = resolveLocale(input.lang);
  const [dict, glDict, esDict] = await Promise.all([
    getDictionary(locale),
    getDictionary('gl'),
    getDictionary('es'),
  ]);
  const edDict = dict.articleEditor;

  try {
    const { user, profile } = await getAuthenticatedUser();
    if (!user || !profile) {
      return { success: false, error: edDict.unauthorized };
    }

    const userRole = String(profile.role || profile.rol || USER_ROLES.READER);
    if (isReaderRole(userRole)) {
      return { success: false, error: edDict.insufficientRole };
    }

    const canDirectPublish = canPublishDirectly(userRole);

    let targetStatus: PublicationStatusValue = PUBLICATION_STATUSES.DRAFT;
    if (isPublishAction(input.action)) {
      if (!canDirectPublish) {
        return {
          success: false,
          error: edDict.onlyPrivilegedCanPublish,
        };
      }
      targetStatus = PUBLICATION_STATUSES.PUBLISHED;
    } else if (input.action === EDITOR_ACTIONS.SUBMIT_APPROVAL) {
      targetStatus = PUBLICATION_STATUSES.IN_REVIEW;
    } else {
      targetStatus = PUBLICATION_STATUSES.DRAFT;
    }

    const titleGl = input.title?.gl?.trim() || '';
    const titleEs = input.title?.es?.trim() || '';
    const currentTitle = titleGl || titleEs;
    const pubType = normalizePublicationType(input.type);
    const origLang = resolveLocale(input.original_language);

    const fallbackTitleGl = glDict.articleEditor.noTitle;
    const fallbackTitleEs = esDict.articleEditor.noTitle;

    const subtitlePayload =
      input.subtitle?.gl || input.subtitle?.es
        ? { gl: input.subtitle?.gl || '', es: input.subtitle?.es || '' }
        : null;
    const contentPayload = {
      gl: stripIndex(input.content?.gl || ''),
      es: stripIndex(input.content?.es || ''),
    };
    const showIndex = Boolean(input.show_index);

    if (input.id) {
      // --- UPDATE EXISTING PUBLICATION ---
      const existing = await getPublicationById(input.id);
      if (!existing) {
        return { success: false, error: edDict.publicationNotFound };
      }

      const isAuthor = existing.author.id === user.id;
      const isAdminOrFounder = canDirectPublish;
      if (!isAuthor && !isAdminOrFounder) {
        return { success: false, error: edDict.notAuthorOrPrivileged };
      }

      const isDraft = existing.status === PUBLICATION_STATUSES.DRAFT;
      const updatedSlug = updatePublicationSlugIfNeeded(currentTitle, existing.slug, isDraft);

      let targetPublishedAt: string | null = null;
      if (targetStatus === PUBLICATION_STATUSES.PUBLISHED) {
        targetPublishedAt = existing.published_at || new Date().toISOString();
      } else {
        targetPublishedAt = null;
      }

      const updatePayload = {
        [PUBLICATION_COLS.TITLE]: {
          gl: titleGl || fallbackTitleGl,
          es: titleEs || fallbackTitleEs,
        },
        [PUBLICATION_COLS.SUBTITLE]: subtitlePayload,
        [PUBLICATION_COLS.SLUG]: updatedSlug,
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

      if (input.tags !== undefined) {
        const { error: tagError } = await syncPublicationTagsBySlugs(input.id, input.tags);
        if (tagError) {
          console.warn('[Action:saveArticle] Error syncing tags:', formatDbError(tagError));
        }
      }

      revalidateArticlePaths(updatedSlug, existing.slug);

      return { success: true, id: input.id, slug: updatedSlug };
    } else {
      // --- CREATE NEW PUBLICATION ---
      const slug = generatePublicationSlug(currentTitle);
      const publishedAt =
        targetStatus === PUBLICATION_STATUSES.PUBLISHED ? new Date().toISOString() : null;

      const insertPayload = {
        [PUBLICATION_COLS.TITLE]: {
          gl: titleGl || fallbackTitleGl,
          es: titleEs || fallbackTitleEs,
        },
        [PUBLICATION_COLS.SUBTITLE]: subtitlePayload,
        [PUBLICATION_COLS.SLUG]: slug,
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

      if (input.tags && input.tags.length > 0) {
        const { error: tagError } = await syncPublicationTagsBySlugs(inserted.id, input.tags);
        if (tagError) {
          console.warn('[Action:saveArticle] Error syncing tags on create:', formatDbError(tagError));
        }
      }

      revalidateArticlePaths(slug);

      return { success: true, id: inserted.id, slug };
    }
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
      return { success: false, error: 'Estado de publicación inválido' };
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
