'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BackButton() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <Link 
      href="/" 
      className="text-charcoal/50 hover:text-charcoal transition-colors font-serif text-2xl shrink-0 cursor-pointer" 
      aria-label="Ir a la página principal"
      title="Ir a la página principal"
    >
      ←
    </Link>
  );
}
