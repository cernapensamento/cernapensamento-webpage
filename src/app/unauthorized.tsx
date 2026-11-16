import './globals.css';
import { RootErrorShell } from '@/components/errors/RootErrorShell';
import { ERROR_CODES } from '@/lib/constants';

export default function GlobalUnauthorized() {
  return <RootErrorShell code={ERROR_CODES.UNAUTHORIZED} />;
}
