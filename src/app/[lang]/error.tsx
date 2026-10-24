'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

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
    <LiteraryError code={ERROR_CODES.SERVER_ERROR} onAction={() => reset()} />
  );
}
