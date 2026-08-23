'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';
import Image from 'next/image';
import { SITE_NAME } from '@/lib/constants';

import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';

interface SideNavBarProps {
  role?: string;
}

export default function SideNavBar({ role }: SideNavBarProps) {
  const pathname = usePathname();
  const params = useParams();
  const lang = params?.lang || 'es';
  const dict = lang === 'es' ? esDict : glDict;
  const dashDict = dict.dashboard;

  const isWriter = role === 'escritor' || role === 'admin' || role === 'invitado';

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-lines z-50">
      <div className="px-8 py-10 flex flex-col h-full">
        <div className="mb-12">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src="/images/logo/cernawhite.png" 
              alt={SITE_NAME} 
              width={400} 
              height={100} 
              className="w-full max-w-[200px] h-auto object-contain block dark:hidden"
              priority
            />
            <Image 
              src="/images/logo/cernablack.png" 
              alt={SITE_NAME} 
              width={400} 
              height={100} 
              className="w-full max-w-[200px] h-auto object-contain hidden dark:block"
              priority
            />
          </Link>
        </div>
        <nav className="flex-grow space-y-1">
          <Link
            className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
              pathname === '/' 
                ? 'text-charcoal bg-parchment border-l-2 border-gold' 
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href={`/${lang}`}
          >
            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="home" style={{ fontFamily: 'Material Symbols Outlined' }}>home</span>
            <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>{dashDict.backToHome}</span>
          </Link>
          {isWriter && (
            <>
              <Link
                className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
                  pathname === '/escritorio'
                    ? 'text-charcoal bg-parchment border-l-2 border-gold'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
                }`}
                href={`/${lang}/escritorio`}
              >
                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="description">description</span>
                <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>{dashDict.myArticles}</span>
              </Link>
              <Link
                className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
                  pathname === '/escritorio/nuevo'
                    ? 'text-charcoal bg-parchment border-l-2 border-gold'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
                }`}
                href={`/${lang}/escritorio/nuevo`}
              >
                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio/nuevo' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="edit_note">edit_note</span>
                <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio/nuevo' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>{dashDict.newArticle}</span>
              </Link>
            </>
          )}
          <Link
            className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
              pathname === '/escritorio/perfil'
                ? 'text-charcoal bg-parchment border-l-2 border-gold'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href={`/${lang}/escritorio/perfil`}
          >
            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio/perfil' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="person">person</span>
            <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio/perfil' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>{dashDict.profile}</span>
          </Link>
        </nav>
        <div className="mt-8 pt-6 border-t border-lines flex flex-row items-center justify-start gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
