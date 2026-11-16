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

/**
 * Checks whether a PostgREST/PostgreSQL error indicates a missing column
 * (e.g., PostgreSQL 42703 undefined_column or PostgREST PGRST204 schema cache miss).
 */
export function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const pgError = error as Partial<PostgrestError> & {
    code?: string;
    message?: string;
    details?: string;
  };
  if (pgError.code !== '42703' && pgError.code !== 'PGRST204') {
    return false;
  }
  const haystack = `${pgError.message || ''} ${pgError.details || ''}`;
  return haystack.includes(columnName);
}
