import React from 'react';
import { formatArticleDate } from '@/lib/date';

export interface FormattedDateProps extends React.TimeHTMLAttributes<HTMLTimeElement> {
  date: string | Date | number | null | undefined;
  lang?: string;
  format?: 'short' | 'long';
}

/**
 * Displays a localized UTC date in a semantic time element, or renders nothing
 * when formatArticleDate returns an empty string. String inputs are copied to
 * dateTime unchanged, Date inputs use ISO, and numeric inputs omit dateTime.
 * Additional time-element props can override the generated attributes.
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
