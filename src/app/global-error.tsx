'use client';

import './globals.css';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { RootErrorShell } from '@/components/errors/RootErrorShell';
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

  return <RootErrorShell code={ERROR_CODES.SERVER_ERROR} onAction={reset} />;
}
