'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí podríamos mandar el error a un servicio de telemetría
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full border border-lines bg-white p-12 text-center">
        <div className="w-12 h-12 border border-lines flex items-center justify-center mx-auto mb-6 text-red-800/50">
          <span className="text-2xl font-serif">!</span>
        </div>
        <h2 className="font-serif text-3xl text-charcoal mb-4">Error en el archivo</h2>
        <p className="font-sans text-charcoal/70 mb-8 leading-relaxed">
          Un percance imprevisto ha interrumpido la carga de este documento. Por favor, intenta restaurar la página.
        </p>
        <div className="flex flex-col gap-4">
          <button type="button"             onClick={() => reset()}
            className="px-6 py-3 bg-charcoal text-white text-sm font-semibold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-charcoal text-charcoal text-sm font-semibold uppercase tracking-widest hover:bg-lines transition-colors"
          >
            Volver a la portada
          </Link>
        </div>
      </div>
    </div>
  );
}
