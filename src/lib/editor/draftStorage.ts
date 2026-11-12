/**
 * Utilities for managing browser-side publication drafts and preventing
 * local cache leakage across user sessions.
 */

export function clearClientDrafts(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cerna_draft_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.warn('[draftStorage] Failed to clear drafts from localStorage:', err);
  }
}
