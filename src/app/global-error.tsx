'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('Critical Layout Error:', error);
  }, [error]);

  return (
    <html lang="gl">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
      </head>
      <body className="antialiased bg-parchment text-charcoal min-h-screen font-sans">
        <LiteraryError code={ERROR_CODES.SERVER_ERROR} onAction={() => reset()} />
      </body>
    </html>
  );
}
