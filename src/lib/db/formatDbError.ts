import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Formats a Postgrest error or network exception into a human-readable string.
 * Prevents logging cryptic empty `{}` error objects when Supabase or the network fails.
 */
export function formatDbError(error: unknown): string {
  if (!error) return 'Unknown database error';
  if (typeof error === 'string') return error;

  const pgError = error as Partial<PostgrestError> & {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  const parts: string[] = [];
  if (pgError.code) parts.push(`[${pgError.code}]`);
  if (pgError.message) parts.push(pgError.message);
  if (pgError.details && pgError.details !== pgError.message) {
    parts.push(`(${pgError.details.trim()})`);
  }
  if (pgError.hint) parts.push(`hint: ${pgError.hint}`);

  if (parts.length > 0) return parts.join(' ');
  if (error instanceof Error) return error.message;

  try {
    const serialized = JSON.stringify(error);
    return serialized !== '{}' ? serialized : String(error);
  } catch {
    return String(error);
  }
}
