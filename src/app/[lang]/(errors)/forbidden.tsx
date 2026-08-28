import { LiteraryError } from '@/components/errors/LiteraryError';

export default function Forbidden() {
  return (
    <LiteraryError code="403" actionHref="/" />
  );
}
