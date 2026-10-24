import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

export default function Unauthorized() {
  return (
    <LiteraryError code={ERROR_CODES.UNAUTHORIZED} actionHref="/login" />
  );
}
