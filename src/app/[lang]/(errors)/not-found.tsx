import { LiteraryError } from '@/components/errors/LiteraryError';

export default function NotFound() {
  return (
    <LiteraryError code="404" actionHref="/" />
  );
}
