import './globals.css';
import { LiteraryError } from '@/components/errors/LiteraryError';

export default function GlobalNotFound() {
  return (
    <LiteraryError code="404" actionHref="/" />
  );
}
