import { LiteraryError } from '@/components/errors/LiteraryError';

export default function BadRequestPage() {
  return (
    <LiteraryError code="400" actionHref="/" />
  );
}
