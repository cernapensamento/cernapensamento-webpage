import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

export default function Forbidden() {
  return (
    <LiteraryError code={ERROR_CODES.FORBIDDEN} actionHref="/" />
  );
}
