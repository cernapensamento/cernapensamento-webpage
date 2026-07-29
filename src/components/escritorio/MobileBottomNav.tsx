'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface MobileBottomNavProps {
  role?: string;
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) || 'es';
  const dict = lang === 'es' ? esDict : glDict;
  const dashDict = dict.dashboard;
  const isWriter = role === 'escritor' || role === 'admin' || role === 'invitado';

  const isCurrentRoute = (route: string) => {
    if (route === '/') {
      return pathname === '/es' || pathname === '/gl' || pathname === '/';
    }
    return pathname.endsWith(route);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface flex items-center justify-around z-50 border-t border-lines">
      <Link
        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
          isCurrentRoute('/')
            ? 'text-gold border-t-2 border-gold bg-parchment/30'
            : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
        }`}
        href={`/${lang}`}
        aria-label="Volver al Inicio"
      >
        <span className="material-symbols-outlined text-[20px]" data-icon="home" style={{ fontFamily: 'Material Symbols Outlined' }}>home</span>
        <span className={`text-[9px] uppercase tracking-wider ${isCurrentRoute('/') ? 'font-semibold' : ''}`}>{dashDict.backToHome.split(' ')[0]}</span>
      </Link>
      {isWriter && (
        <>
          <Link
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
              isCurrentRoute('/escritorio')
                ? 'text-gold border-t-2 border-gold bg-parchment/30'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
            }`}
            href={`/${lang}/escritorio`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="description" style={{ fontFamily: 'Material Symbols Outlined' }}>description</span>
            <span className={`text-[9px] uppercase tracking-wider ${isCurrentRoute('/escritorio') ? 'font-semibold' : ''}`}>{dashDict.title}</span>
          </Link>
          <Link
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
              isCurrentRoute('/escritorio/nuevo')
                ? 'text-gold border-t-2 border-gold bg-parchment/30'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
            }`}
            href={`/${lang}/escritorio/nuevo`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="edit_note" style={{ fontFamily: 'Material Symbols Outlined' }}>edit_note</span>
            <span className={`text-[9px] uppercase tracking-wider ${isCurrentRoute('/escritorio/nuevo') ? 'font-semibold' : ''}`}>{dashDict.newArticle.split(' ')[0]}</span>
          </Link>
        </>
      )}
      <Link
        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
          isCurrentRoute('/escritorio/perfil')
            ? 'text-gold border-t-2 border-gold bg-parchment/30'
            : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/10 border-t-2 border-transparent'
        }`}
        href={`/${lang}/escritorio/perfil`}
      >
        <span className="material-symbols-outlined text-[20px]" data-icon="person" style={{ fontFamily: 'Material Symbols Outlined' }}>person</span>
        <span className={`text-[9px] uppercase tracking-wider ${isCurrentRoute('/escritorio/perfil') ? 'font-semibold' : ''}`}>{dashDict.profile}</span>
      </Link>
    </nav>
  );
}
