'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { LiteraryError } from '@/components/errors/LiteraryError';

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
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
      </head>
      <body className="antialiased bg-parchment text-charcoal min-h-screen font-sans">
        <LiteraryError code="500" onAction={() => reset()} />
      </body>
    </html>
  );
}
