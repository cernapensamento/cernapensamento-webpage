'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { LiteraryError } from '@/components/errors/LiteraryError';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <LiteraryError code="500" onAction={() => reset()} />
  );
}
