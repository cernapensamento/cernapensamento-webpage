import './globals.css';
import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

export default function GlobalUnauthorized() {
  return (
    <html lang="gl">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
      </head>
      <body className="antialiased bg-parchment text-charcoal min-h-screen font-sans">
        <LiteraryError code={ERROR_CODES.UNAUTHORIZED} actionHref="/login" />
      </body>
    </html>
  );
}
