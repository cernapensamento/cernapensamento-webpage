/**
 * Publication Slug Utilities
 * Centralized slug generation, normalization, and placeholder detection.
 */

/**
 * Strips accents, punctuation, and non-alphanumeric characters, returning a hyphenated slug.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a random 6-character alphanumeric suffix.
 */
export function generateRandomSuffix(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Returns true if the slug is null, empty, or a known temporary placeholder.
 */
export function isPlaceholderSlug(slug?: string | null): boolean {
  if (!slug || slug.trim() === '') return true;
  const s = slug.toLowerCase().trim();
  return (
    s.startsWith('novo-artigo') ||
    s.startsWith('nuevo-articulo') ||
    s.startsWith('new-article') ||
    s.startsWith('sin-titulo') ||
    s.startsWith('sen-titulo') ||
    s.startsWith('untitled')
  );
}

/**
 * Extracts the 6-character random suffix from an existing slug if present (e.g. `foo-bar-a1b2c3` -> `a1b2c3`).
 */
export function extractSlugSuffix(slug?: string | null): string | null {
  if (!slug) return null;
  const match = slug.match(/-([a-z0-9]{6})$/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Generates a fresh publication slug from a title, appending a 6-character suffix.
 */
export function generatePublicationSlug(title?: string | null): string {
  const base = title ? slugify(title) : '';
  const safeBase = base || 'artigo';
  const suffix = generateRandomSuffix(6);
  return `${safeBase}-${suffix}`;
}

/**
 * Updates a publication slug if it is a draft or placeholder, preserving the original
 * suffix if available. If the article is already published and not a placeholder, the
 * existing slug is preserved to prevent breaking links.
 */
export function updatePublicationSlugIfNeeded(
  currentTitle: string,
  existingSlug?: string | null,
  isDraft: boolean = true
): string {
  // If no existing slug, generate a fresh one
  if (!existingSlug || existingSlug.trim() === '') {
    return generatePublicationSlug(currentTitle);
  }

  const isPlaceholder = isPlaceholderSlug(existingSlug);

  // If not a draft and not a placeholder, do not modify the public URL
  if (!isDraft && !isPlaceholder) {
    return existingSlug;
  }

  const base = slugify(currentTitle);
  if (!base) {
    return existingSlug;
  }

  const suffix = extractSlugSuffix(existingSlug) || generateRandomSuffix(6);
  return `${base}-${suffix}`;
}
