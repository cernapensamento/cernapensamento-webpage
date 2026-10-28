import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

export default function NotFound() {
  return (
    <LiteraryError code={ERROR_CODES.NOT_FOUND} actionHref="/" />
  );
}
