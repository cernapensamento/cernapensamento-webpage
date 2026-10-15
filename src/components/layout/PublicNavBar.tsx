'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import { SITE_NAME } from '@/lib/constants';

interface DropdownItem {
  title: string;
  desc: string;
  href: string;
}

export default function PublicNavBar() {
  const { user, profile: userProfile, loading } = useAuth();
  const lang = useLocale();
  const pathname = usePathname();
  const dict = getDictionaryClient(lang);
  const isEs = lang === 'es';

  // Desktop active dropdown ('publicacions' | 'asociacion' | 'autores' | null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // Mobile hamburger menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mobile accordion state
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});

  // Reset open menus when pathname changes without effect
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }

  const navRef = useRef<HTMLElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const toggleMobileAccordion = (name: string) => {
    setMobileExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Dropdown Content
  const publicacionsItems: DropdownItem[] = [
    {
      title: isEs ? 'Artículos de Opinión' : 'Artigos de Opinión',
      desc: isEs ? 'Columnas semanales y análisis de actualidad.' : 'Columnas semanais e análise de actualidade.',
      href: `/${lang}/articulos?tipo=artigo`,
    },
    {
      title: isEs ? 'Ensayos Filosóficos' : 'Ensaios Filosóficos',
      desc: isEs ? 'Monografías extensas sobre economía, política y sociedad.' : 'Monográficos extensos sobre economía, política e sociedade.',
      href: `/${lang}/articulos?tipo=ensaio`,
    },
    {
      title: isEs ? 'Colección Narrativa' : 'Colección Narrativa',
      desc: isEs ? 'Prosa contemporánea y ficción editorial.' : 'Prosa contemporánea e ficción editorial.',
      href: `/${lang}/proyecto-editorial/coleccion-narrativa`,
    },
    {
      title: isEs ? 'Colección Poesía' : 'Colección Poesía',
      desc: isEs ? 'Creación poética y lírica.' : 'Creación poética e lírica.',
      href: `/${lang}/proyecto-editorial/coleccion-poesia`,
    },
  ];

  const asociacionItems: DropdownItem[] = [
    {
      title: isEs ? 'El Proyecto y Manifiesto' : 'O Proxecto e Manifesto',
      desc: isEs ? 'Principios fundacionales e ideario de Cerna.' : 'Principios fundacionais e ideario de Cerna.',
      href: `/${lang}/asociacion`,
    },
    {
      title: isEs ? 'Estatutos Sociales' : 'Estatutos Sociais',
      desc: isEs ? 'Normativa interna y marco jurídico de la asociación.' : 'Normativa interna e marco xurídico da asociación.',
      href: `/${lang}/asociacion/estatutos`,
    },
    {
      title: isEs ? 'Colecciones Editoriales' : 'Coleccións Editoriais',
      desc: isEs ? 'Las cuatro ramas de publicación de nuestro sello.' : 'As catro ramas de publicación do noso selo.',
      href: `/${lang}/asociacion`,
    },
  ];

  const autoresItems: DropdownItem[] = [
    {
      title: 'Diego Araújo',
      desc: isEs ? 'Economía, teoría del valor y filosofía política.' : 'Economía, teoría do valor e filosofía política.',
      href: `/${lang}/autor/diego-araujo`,
    },
    {
      title: 'Anxo Pérez',
      desc: isEs ? 'Pensamiento crítico, literatura y sociedad.' : 'Pensamento crítico, literatura e sociedade.',
      href: `/${lang}/autor/anxo-perez`,
    },
    {
      title: 'Héctor González',
      desc: isEs ? 'Teoría de juegos, ensayo y política.' : 'Teoría de xogos, ensaio e política.',
      href: `/${lang}/autor/hector-gonzalez`,
    },
    {
      title: 'Denis Fernández',
      desc: isEs ? 'Análisis institucional y cultural.' : 'Análise institucional e cultural.',
      href: `/${lang}/autor/denis-fernandez`,
    },
  ];

  return (
    <header className="bg-parchment/95 backdrop-blur-md border-b border-lines w-full sticky top-0 z-50">
      <nav ref={navRef} className="w-full max-w-[1280px] mx-auto px-5 md:px-12 h-18 md:h-20 flex items-center justify-between relative">
        
        {/* ==================================================== */}
        {/* LEFT: BRAND LOGO */}
        {/* ==================================================== */}
        <div className="flex items-center gap-6">
          <Link href={`/${lang}`} className="flex items-center hover:opacity-85 transition-opacity py-2" aria-label={SITE_NAME}>
            <Image
              src="/images/logo/cernawhite.png"
              alt={SITE_NAME}
              width={260}
              height={65}
              className="h-9 md:h-11 w-auto object-contain block dark:hidden"
              priority
            />
            <Image
              src="/images/logo/cernablack.png"
              alt={SITE_NAME}
              width={260}
              height={65}
              className="h-9 md:h-11 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>
        </div>

        {/* ==================================================== */}
        {/* DESKTOP NAVIGATION (OSIX STYLE WITH DROPDOWNS) */}
        {/* ==================================================== */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 h-full">
          
          {/* 1. Publicacións Dropdown */}
          <div className="relative h-full flex items-center">
            <button
              type="button"
              onClick={() => toggleDropdown('publicacions')}
              className={`h-full px-3.5 xl:px-4 flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${
                activeDropdown === 'publicacions'
                  ? 'text-charcoal border-b-2 border-charcoal font-bold'
                  : 'text-charcoal/80 hover:text-charcoal'
              }`}
              aria-expanded={activeDropdown === 'publicacions'}
            >
              <span>{isEs ? 'Publicaciones' : 'Publicacións'}</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'publicacions' ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {activeDropdown === 'publicacions' && (
              <div className="absolute top-full left-0 w-[380px] bg-parchment border border-lines shadow-2xl z-50 animate-appear-instant">
                <div className="p-2 flex flex-col">
                  {publicacionsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3.5 hover:bg-surface border-b border-lines/40 last:border-0 transition-colors group flex items-start justify-between"
                    >
                      <div>
                        <span className="font-sans font-bold text-sm text-charcoal group-hover:text-gold transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-sans text-xs text-charcoal/65 block mt-0.5 leading-relaxed">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-charcoal/40 group-hover:text-gold group-hover:translate-x-1 transition-all text-xs pt-0.5">
                        →
                      </span>
                    </Link>
                  ))}
                  <div className="pt-2 px-3 pb-2 border-t border-lines mt-1">
                    <Link
                      href={`/${lang}/articulos`}
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal hover:text-gold flex items-center justify-between py-1 transition-colors"
                    >
                      <span>{isEs ? 'TODAS LAS PUBLICACIONES' : 'TODAS AS PUBLICACIÓNS'}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Asociación Dropdown */}
          <div className="relative h-full flex items-center">
            <button
              type="button"
              onClick={() => toggleDropdown('asociacion')}
              className={`h-full px-3.5 xl:px-4 flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${
                activeDropdown === 'asociacion'
                  ? 'text-charcoal border-b-2 border-charcoal font-bold'
                  : 'text-charcoal/80 hover:text-charcoal'
              }`}
              aria-expanded={activeDropdown === 'asociacion'}
            >
              <span>{isEs ? 'Asociación' : 'A Asociación'}</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'asociacion' ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {activeDropdown === 'asociacion' && (
              <div className="absolute top-full left-0 w-[380px] bg-parchment border border-lines shadow-2xl z-50 animate-appear-instant">
                <div className="p-2 flex flex-col">
                  {asociacionItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3.5 hover:bg-surface border-b border-lines/40 last:border-0 transition-colors group flex items-start justify-between"
                    >
                      <div>
                        <span className="font-sans font-bold text-sm text-charcoal group-hover:text-gold transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-sans text-xs text-charcoal/65 block mt-0.5 leading-relaxed">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-charcoal/40 group-hover:text-gold group-hover:translate-x-1 transition-all text-xs pt-0.5">
                        →
                      </span>
                    </Link>
                  ))}
                  <div className="pt-2 px-3 pb-2 border-t border-lines mt-1">
                    <Link
                      href={`/${lang}/asociacion`}
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal hover:text-gold flex items-center justify-between py-1 transition-colors"
                    >
                      <span>{isEs ? 'CONOCE LA ASOCIACIÓN' : 'COÑECE A ASOCIACIÓN'}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Autores Dropdown */}
          <div className="relative h-full flex items-center">
            <button
              type="button"
              onClick={() => toggleDropdown('autores')}
              className={`h-full px-3.5 xl:px-4 flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${
                activeDropdown === 'autores'
                  ? 'text-charcoal border-b-2 border-charcoal font-bold'
                  : 'text-charcoal/80 hover:text-charcoal'
              }`}
              aria-expanded={activeDropdown === 'autores'}
            >
              <span>{isEs ? 'Autores' : 'Autores'}</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'autores' ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {activeDropdown === 'autores' && (
              <div className="absolute top-full left-0 w-[360px] bg-parchment border border-lines shadow-2xl z-50 animate-appear-instant">
                <div className="p-2 flex flex-col">
                  {autoresItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3.5 hover:bg-surface border-b border-lines/40 last:border-0 transition-colors group flex items-start justify-between"
                    >
                      <div>
                        <span className="font-sans font-bold text-sm text-charcoal group-hover:text-gold transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-sans text-xs text-charcoal/65 block mt-0.5 leading-relaxed">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-charcoal/40 group-hover:text-gold group-hover:translate-x-1 transition-all text-xs pt-0.5">
                        →
                      </span>
                    </Link>
                  ))}
                  <div className="pt-2 px-3 pb-2 border-t border-lines mt-1">
                    <Link
                      href={`/${lang}#autores`}
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal hover:text-gold flex items-center justify-between py-1 transition-colors"
                    >
                      <span>{isEs ? 'TODOS LOS AUTORES' : 'TODOS OS AUTORES'}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Noticias (Direct Link) */}
          <Link
            href={`/${lang}/noticias`}
            className="h-full px-3.5 xl:px-4 flex items-center text-sm font-semibold tracking-wide text-charcoal/80 hover:text-charcoal transition-colors"
          >
            {isEs ? 'Noticias' : 'Novas'}
          </Link>

        </div>

        {/* ==================================================== */}
        {/* RIGHT CONTROLS: LANG, THEME, USER & OSIX CTA */}
        {/* ==================================================== */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* Language Toggle */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User desk / Login */}
          {!loading && user ? (
            <Link
              href={`/${lang}/escritorio`}
              className="w-10 h-10 border border-lines bg-parchment hover:bg-lines flex items-center justify-center transition-colors relative overflow-hidden"
              title={dict.nav.escritorio}
            >
              {userProfile?.avatar_url ? (
                <Image className="object-cover" alt="Perfil" src={userProfile.avatar_url} fill sizes="40px" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">person</span>
              )}
            </Link>
          ) : !loading && (
            <Link
              href={`/${lang}/login`}
              className="w-10 h-10 border border-lines bg-parchment text-charcoal hover:bg-lines flex items-center justify-center transition-colors"
              title={dict.nav.login}
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </Link>
          )}

          {/* OSIX-STYLE SHARP CTA BUTTON */}
          <Link
            href={`/${lang}/contacto`}
            className="btn-primary ml-1"
          >
            <span>{isEs ? 'CONTACTO' : 'CONTACTO'}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* ==================================================== */}
        {/* MOBILE CONTROLS (HAMBURGER + CONTROLS) */}
        {/* ==================================================== */}
        <div className="flex lg:hidden items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Pechar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

      </nav>

      {/* ==================================================== */}
      {/* MOBILE RESPONSIVE DRAWER / ACCORDIONS */}
      {/* ==================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-18 bottom-0 bg-parchment z-50 overflow-y-auto border-t border-lines animate-appear-instant flex flex-col justify-between p-6">
          <div className="flex flex-col gap-6">
            
            {/* 1. Publicacións Accordion */}
            <div className="border-b border-lines pb-4">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('publicacions')}
                className="w-full flex items-center justify-between text-xl font-serif font-bold text-charcoal py-2"
              >
                <span>{isEs ? 'Publicaciones' : 'Publicacións'}</span>
                <span className={`material-symbols-outlined transition-transform ${mobileExpanded['publicacions'] ? 'rotate-180 text-gold' : ''}`}>
                  expand_more
                </span>
              </button>
              {mobileExpanded['publicacions'] && (
                <div className="flex flex-col gap-3 pl-3 pt-3 border-l-2 border-gold/40 mt-2">
                  {publicacionsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-sans font-medium text-charcoal/80 hover:text-gold py-1"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Link
                    href={`/${lang}/articulos`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest text-gold pt-2"
                  >
                    {isEs ? 'Ver todo el archivo →' : 'Ver todo o arquivo →'}
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Asociación Accordion */}
            <div className="border-b border-lines pb-4">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('asociacion')}
                className="w-full flex items-center justify-between text-xl font-serif font-bold text-charcoal py-2"
              >
                <span>{isEs ? 'Asociación' : 'A Asociación'}</span>
                <span className={`material-symbols-outlined transition-transform ${mobileExpanded['asociacion'] ? 'rotate-180 text-gold' : ''}`}>
                  expand_more
                </span>
              </button>
              {mobileExpanded['asociacion'] && (
                <div className="flex flex-col gap-3 pl-3 pt-3 border-l-2 border-gold/40 mt-2">
                  {asociacionItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-sans font-medium text-charcoal/80 hover:text-gold py-1"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Link
                    href={`/${lang}/asociacion`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest text-gold pt-2"
                  >
                    {isEs ? 'Conoce la Asociación →' : 'Coñece a Asociación →'}
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Autores Accordion */}
            <div className="border-b border-lines pb-4">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('autores')}
                className="w-full flex items-center justify-between text-xl font-serif font-bold text-charcoal py-2"
              >
                <span>{isEs ? 'Autores' : 'Autores'}</span>
                <span className={`material-symbols-outlined transition-transform ${mobileExpanded['autores'] ? 'rotate-180 text-gold' : ''}`}>
                  expand_more
                </span>
              </button>
              {mobileExpanded['autores'] && (
                <div className="flex flex-col gap-3 pl-3 pt-3 border-l-2 border-gold/40 mt-2">
                  {autoresItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-sans font-medium text-charcoal/80 hover:text-gold py-1"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Link
                    href={`/${lang}#autores`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest text-gold pt-2"
                  >
                    {isEs ? 'Todos los autores →' : 'Todos os autores →'}
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Noticias (Direct Link) */}
            <div className="border-b border-lines pb-4">
              <Link
                href={`/${lang}/noticias`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-serif font-bold text-charcoal hover:text-gold py-2 block"
              >
                {isEs ? 'Noticias y Avisos' : 'Novas e Avisos'}
              </Link>
            </div>

            {/* 5. Escritorio / Perfil */}
            <div className="border-b border-lines pb-4">
              <Link
                href={user ? `/${lang}/escritorio` : `/${lang}/login`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-serif font-bold text-charcoal hover:text-gold py-2 flex items-center justify-between"
              >
                <span>{user ? dict.nav.escritorio : dict.nav.login}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

          </div>

          {/* Bottom Full-Width CTA */}
          <div className="pt-8 pb-4">
            <Link
              href={`/${lang}/contacto`}
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full text-center justify-center py-4 text-sm tracking-[0.16em]"
            >
              <span>{isEs ? 'CONTACTO' : 'CONTACTO'}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

        </div>
      )}
    </header>
  );
}
