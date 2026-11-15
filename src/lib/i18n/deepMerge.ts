/**
 * Deeply merges a source object into a target object, returning a new object.
 * Used for merging fallback locale dictionaries with target locale dictionaries.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source?: Record<string, unknown> | null
): T {
  if (!source || typeof source !== 'object') {
    return { ...target };
  }

  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result as T;
}
