import './globals.css';
import { LiteraryError } from '@/components/errors/LiteraryError';

export default function GlobalUnauthorized() {
  return (
    <LiteraryError code="401" actionHref="/login" />
  );
}
