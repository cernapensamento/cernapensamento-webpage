import { LiteraryError } from '@/components/errors/LiteraryError';

export default function Unauthorized() {
  return (
    <LiteraryError code="401" actionHref="/login" />
  );
}
