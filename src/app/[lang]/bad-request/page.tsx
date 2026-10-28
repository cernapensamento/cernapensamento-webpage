import { LiteraryError } from '@/components/errors/LiteraryError';
import { ERROR_CODES } from '@/lib/constants';

export default function BadRequestPage() {
  return (
    <LiteraryError code={ERROR_CODES.BAD_REQUEST} actionHref="/" />
  );
}
