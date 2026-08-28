import './globals.css';
import { LiteraryError } from '@/components/errors/LiteraryError';

export default function GlobalForbidden() {
  return (
    <LiteraryError code="403" actionHref="/" />
  );
}
