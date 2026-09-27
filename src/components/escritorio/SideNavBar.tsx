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
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function SideNavBar({ role, collapsed = false, onToggle }: SideNavBarProps) {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) || 'es';
  const dict = lang === 'es' ? esDict : glDict;
  const dashDict = dict.dashboard;

  const isWriter = role === 'escritor' || role === 'admin' || role === 'invitado';

  const isHome = pathname === '/' || pathname === `/${lang}`;
  const isArticles = pathname === `/${lang}/escritorio` || pathname === '/escritorio';
  const isNew = pathname === `/${lang}/escritorio/nuevo` || pathname === '/escritorio/nuevo';
  const isProfile = pathname === `/${lang}/escritorio/perfil` || pathname === '/escritorio/perfil';

  return (
    <aside
      className={`hidden md:flex flex-col h-screen fixed left-0 top-0 bg-surface border-r border-lines z-50 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex flex-col h-full ${collapsed ? 'px-2 py-6' : 'px-8 py-10'}`}>
        {/* Header: Logo and Toggle */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-4 mb-8' : 'justify-between mb-12'}`}>
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity" title={SITE_NAME}>
            {collapsed ? (
              <span className="font-serif text-2xl font-bold text-gold" title={SITE_NAME}>
                §
              </span>
            ) : (
              <>
                <Image 
                  src="/images/logo/cernawhite.png" 
                  alt={SITE_NAME} 
                  width={400} 
                  height={100} 
                  className="w-full max-w-[150px] h-auto object-contain block dark:hidden"
                  priority
                />
                <Image 
                  src="/images/logo/cernablack.png" 
                  alt={SITE_NAME} 
                  width={400} 
                  height={100} 
                  className="w-full max-w-[150px] h-auto object-contain hidden dark:block"
                  priority
                />
              </>
            )}
          </Link>

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className={`flex items-center transition-all duration-300 cursor-pointer group rounded-none ${
                collapsed
                  ? 'w-full justify-center p-3 text-charcoal/60 hover:text-gold hover:bg-lines/30 border-l-2 border-transparent hover:border-gold'
                  : 'p-2 border border-lines/80 text-charcoal/60 hover:text-gold hover:border-gold hover:bg-gold/10'
              }`}
              title={collapsed ? (lang === 'gl' ? 'Despregar barra lateral' : 'Desplegar barra lateral') : (lang === 'gl' ? 'Pregar barra lateral' : 'Plegar barra lateral')}
              aria-label={collapsed ? 'Despregar barra lateral' : 'Plegar barra lateral'}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110" style={{ fontFamily: 'Material Symbols Outlined' }}>
                {collapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-1">
          <Link
            className={`flex items-center transition-all duration-300 group rounded-none ${
              collapsed ? 'justify-center p-3' : 'gap-4 py-3.5 px-4'
            } ${
              isHome 
                ? 'text-charcoal bg-parchment border-l-2 border-gold' 
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href={`/${lang}`}
            title={dashDict.backToHome}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                isHome ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'
              }`}
              data-icon="home"
              style={{ fontFamily: 'Material Symbols Outlined' }}
            >
              home
            </span>
            {!collapsed && (
              <span
                className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 truncate ${
                  isHome ? 'font-semibold' : 'group-hover:translate-x-1'
                }`}
              >
                {dashDict.backToHome}
              </span>
            )}
          </Link>

          {isWriter && (
            <>
              <Link
                className={`flex items-center transition-all duration-300 group rounded-none ${
                  collapsed ? 'justify-center p-3' : 'gap-4 py-3.5 px-4'
                } ${
                  isArticles
                    ? 'text-charcoal bg-parchment border-l-2 border-gold'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
                }`}
                href={`/${lang}/escritorio`}
                title={dashDict.myArticles}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                    isArticles ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'
                  }`}
                  data-icon="description"
                  style={{ fontFamily: 'Material Symbols Outlined' }}
                >
                  description
                </span>
                {!collapsed && (
                  <span
                    className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 truncate ${
                      isArticles ? 'font-semibold' : 'group-hover:translate-x-1'
                    }`}
                  >
                    {dashDict.myArticles}
                  </span>
                )}
              </Link>

              <Link
                className={`flex items-center transition-all duration-300 group rounded-none ${
                  collapsed ? 'justify-center p-3' : 'gap-4 py-3.5 px-4'
                } ${
                  isNew
                    ? 'text-charcoal bg-parchment border-l-2 border-gold'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
                }`}
                href={`/${lang}/escritorio/nuevo`}
                title={dashDict.newArticle}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                    isNew ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'
                  }`}
                  data-icon="edit_note"
                  style={{ fontFamily: 'Material Symbols Outlined' }}
                >
                  edit_note
                </span>
                {!collapsed && (
                  <span
                    className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 truncate ${
                      isNew ? 'font-semibold' : 'group-hover:translate-x-1'
                    }`}
                  >
                    {dashDict.newArticle}
                  </span>
                )}
              </Link>
            </>
          )}

          <Link
            className={`flex items-center transition-all duration-300 group rounded-none ${
              collapsed ? 'justify-center p-3' : 'gap-4 py-3.5 px-4'
            } ${
              isProfile
                ? 'text-charcoal bg-parchment border-l-2 border-gold'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href={`/${lang}/escritorio/perfil`}
            title={dashDict.profile}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
                isProfile ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'
              }`}
              data-icon="person"
              style={{ fontFamily: 'Material Symbols Outlined' }}
            >
              person
            </span>
            {!collapsed && (
              <span
                className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 truncate ${
                  isProfile ? 'font-semibold' : 'group-hover:translate-x-1'
                }`}
              >
                {dashDict.profile}
              </span>
            )}
          </Link>
        </nav>

        {/* Footer */}
        <div
          className={`mt-8 pt-6 border-t border-lines flex ${
            collapsed ? 'flex-col items-center gap-3' : 'flex-row items-center justify-start gap-2'
          }`}
        >
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
