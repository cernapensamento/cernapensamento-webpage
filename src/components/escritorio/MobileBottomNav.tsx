'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileBottomNavProps {
  role?: string;
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const isWriter = role === 'escritor' || role === 'admin' || role === 'invitado';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface flex items-center justify-around z-50 border-t border-lines">
      <Link
        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
          pathname === '/'
            ? 'text-gold border-t-2 border-gold bg-parchment/30'
            : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
        }`}
        href="/"
        aria-label="Volver al Inicio"
      >
        <span className="material-symbols-outlined text-[20px]" data-icon="home" style={{ fontFamily: 'Material Symbols Outlined' }}>home</span>
        <span className={`text-[9px] uppercase tracking-wider ${pathname === '/' ? 'font-semibold' : ''}`}>Inicio</span>
      </Link>
      {isWriter && (
        <>
          <Link
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
              pathname === '/escritorio'
                ? 'text-gold border-t-2 border-gold bg-parchment/30'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
            }`}
            href="/escritorio"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="description" style={{ fontFamily: 'Material Symbols Outlined' }}>description</span>
            <span className={`text-[9px] uppercase tracking-wider ${pathname === '/escritorio' ? 'font-semibold' : ''}`}>Escritorio</span>
          </Link>
          <Link
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
              pathname === '/escritorio/nuevo'
                ? 'text-gold border-t-2 border-gold bg-parchment/30'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
            }`}
            href="/escritorio/nuevo"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="edit_note" style={{ fontFamily: 'Material Symbols Outlined' }}>edit_note</span>
            <span className={`text-[9px] uppercase tracking-wider ${pathname === '/escritorio/nuevo' ? 'font-semibold' : ''}`}>Nuevo</span>
          </Link>
        </>
      )}
      <Link
        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
          pathname === '/escritorio/perfil'
            ? 'text-gold border-t-2 border-gold bg-parchment/30'
            : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
        }`}
        href="/escritorio/perfil"
      >
        <span className="material-symbols-outlined text-[20px]" data-icon="person" style={{ fontFamily: 'Material Symbols Outlined' }}>person</span>
        <span className={`text-[9px] uppercase tracking-wider ${pathname === '/escritorio/perfil' ? 'font-semibold' : ''}`}>Perfil</span>
      </Link>
    </nav>
  );
}
