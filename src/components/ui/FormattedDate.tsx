import React from 'react';
import { formatArticleDate } from '@/lib/date';

export interface FormattedDateProps extends React.TimeHTMLAttributes<HTMLTimeElement> {
  date: string | Date | number | null | undefined;
  lang?: string;
  format?: 'short' | 'long';
}

/**
 * Universal, semantic and hydration-safe date display component.
 *
 * Guarantees consistent SSR and client rendering in Galician ('gl') and Spanish ('es')
 * without locale fallback issues in client browsers, suppresses hydration mismatch warnings,
 * and sets the standard machine-readable ISO `dateTime` attribute.
 */
export default function FormattedDate({
  date,
  lang = 'gl',
  format = 'short',
  className,
  ...props
}: FormattedDateProps) {
  const formatted = formatArticleDate(date, lang, { format });
  if (!formatted) return null;

  const isoDateTime =
    typeof date === 'string'
      ? date
      : date instanceof Date
      ? date.toISOString()
      : undefined;

  return (
    <time
      dateTime={isoDateTime}
      suppressHydrationWarning
      className={className}
      {...props}
    >
      {formatted}
    </time>
  );
}

export { FormattedDate };
