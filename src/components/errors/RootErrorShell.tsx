'use client';

import { useLocale } from '@/hooks/useLocale';
import { fontVariables } from '@/lib/fonts';
import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES, type ErrorCode } from '@/lib/constants';

interface RootErrorShellProps {
  code: ErrorCode;
  onAction?: () => void;
  actionHref?: string;
}

/**
 * Shared HTML document shell for root-level Next.js error boundaries.
 */
export function RootErrorShell({
  code,
  onAction,
  actionHref,
}: RootErrorShellProps) {
  const lang = useLocale();
  const resolvedActionHref =
    actionHref ||
    (onAction
      ? undefined
      : code === ERROR_CODES.UNAUTHORIZED
        ? `/${lang}/login`
        : `/${lang}`);

  return (
    <html lang={lang} className={`${fontVariables} antialiased`}>
      <body>
        <LiteraryError
          code={code}
          onAction={onAction}
          actionHref={resolvedActionHref}
        />
      </body>
    </html>
  );
}
