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
    Sentry.captureException(error);
    console.error('Critical Layout Error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="antialiased bg-parchment text-charcoal min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full border border-lines bg-surface p-12 text-center shadow-sm">
            <div className="w-16 h-16 border border-lines flex items-center justify-center mx-auto mb-6 text-red-800/80 bg-red-50">
              <span className="material-symbols-outlined text-3xl">report</span>
            </div>
            <h1 className="font-serif text-3xl text-charcoal mb-4">Error Crítico</h1>
            <p className="font-sans text-charcoal/70 mb-8 leading-relaxed text-sm">
              La plataforma ha sufrido un fallo irrecuperable en su estructura principal. Nuestros editores han sido notificados.
            </p>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-4 bg-charcoal text-parchment text-xs font-semibold uppercase tracking-widest hover:bg-gold transition-colors cursor-pointer"
              >
                Intentar Restaurar
              </button>
              <Link
                href="/"
                className="px-6 py-4 border border-charcoal text-charcoal text-xs font-semibold uppercase tracking-widest hover:bg-lines transition-colors inline-block"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
