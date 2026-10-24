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

  // Desktop active dropdown ('publicacions' | 'asociacion' | 'autores' | null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // Mobile hamburger menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mobile accordion state
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});

  // Reset open menus when pathname changes
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

  // Dropdown Content from Dictionary
  const publicacionsItems: DropdownItem[] = [
    {
      title: dict.nav?.artigosOpinion,
      desc: dict.nav?.artigosDesc,
      href: `/${lang}/articulos?tipo=article`,
    },
    {
      title: dict.nav?.ensaiosFilosoficos,
      desc: dict.nav?.ensaiosDesc,
      href: `/${lang}/articulos?tipo=essay`,
    },
    {
      title: dict.nav?.coleccionNarrativa,
      desc: dict.nav?.narrativaDesc,
      href: `/${lang}/articulos?tipo=column`,
    },
    {
      title: dict.nav?.coleccionPoesia,
      desc: dict.nav?.poesiaDesc,
      href: `/${lang}/articulos?tipo=poetry`,
    },
  ];

  const asociacionItems: DropdownItem[] = [
    {
      title: dict.nav?.proxectoManifesto,
      desc: dict.nav?.proxectoDesc,
      href: `/${lang}/asociacion#manifesto`,
    },
    {
      title: dict.nav?.estatutosSociais,
      desc: dict.nav?.estatutosDesc,
      href: `/${lang}/asociacion#estatutos`,
    },
    {
      title: dict.nav?.coleccionsEditoriais,
      desc: dict.nav?.coleccionsDesc,
      href: `/${lang}/asociacion#coleccions`,
    },
  ];

  const autoresItems: DropdownItem[] = [
    {
      title: 'Diego Araújo',
      desc: dict.nav?.founderBios?.diego || '',
      href: `/${lang}/autor/diego-araujo`,
    },
    {
      title: 'Anxo Pérez',
      desc: dict.nav?.founderBios?.anxo || '',
      href: `/${lang}/autor/anxo-perez`,
    },
    {
      title: 'Héctor González',
      desc: dict.nav?.founderBios?.hector || '',
      href: `/${lang}/autor/hector-gonzalez`,
    },
    {
      title: 'Denis Fernández',
      desc: dict.nav?.founderBios?.denis || '',
      href: `/${lang}/autor/denis-fernandez`,
    },
  ];

  return (
    <header data-print="hide" className="bg-parchment dark:bg-[#121212] border-b border-lines w-full sticky top-0 z-[100]">
      <nav ref={navRef} className="w-full max-w-[1280px] mx-auto px-5 md:px-12 h-16 md:h-20 flex items-center justify-between relative">
        
        {/* ==================================================== */}
        {/* LEFT: BRAND LOGO */}
        {/* ==================================================== */}
        <div className="flex items-center gap-6">
          <Link href={`/${lang}`} className="flex items-center hover:opacity-85 transition-opacity py-2" aria-label={SITE_NAME}>
            <Image
              src="/images/logo/screen.webp"
              alt={SITE_NAME}
              width={48}
              height={48}
              className="h-9 w-9 md:h-11 md:w-11 object-contain block dark:hidden"
              priority
              unoptimized
            />
            <Image
              src="/images/logo/screen_black.webp"
              alt={SITE_NAME}
              width={48}
              height={48}
              className="h-9 w-9 md:h-11 md:w-11 object-contain hidden dark:block"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* ==================================================== */}
        {/* DESKTOP NAVIGATION (DROPDOWNS WITH DIRECT LINKS) */}
        {/* ==================================================== */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 h-full">
          
          {/* 1. Publicacións: Direct Link to /articulos + Dropdown Toggle */}
          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('publicacions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className={`h-full flex items-center transition-colors ${
              activeDropdown === 'publicacions'
                ? 'text-charcoal border-b-2 border-charcoal font-bold'
                : 'text-charcoal/80 hover:text-charcoal'
            }`}>
              <Link
                href={`/${lang}/articulos`}
                className="h-full pl-3.5 pr-1 xl:pl-4 xl:pr-1.5 flex items-center text-sm font-semibold tracking-wide"
              >
                {dict.nav?.publicaciones}
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('publicacions');
                }}
                className="h-full pr-3 text-charcoal/60 hover:text-charcoal flex items-center"
                aria-label={dict.nav?.publicaciones}
                aria-expanded={activeDropdown === 'publicacions'}
              >
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'publicacions' ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            </div>

            {activeDropdown === 'publicacions' && (
              <div className="absolute top-full left-0 w-[380px] bg-parchment border border-lines shadow-2xl z-50 animate-appear-instant">
                <div className="p-2 flex flex-col">
                  {publicacionsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3.5 hover:bg-surface border-b border-lines/40 last:border-0 transition-colors group/item flex items-start justify-between"
                    >
                      <div>
                        <span className="font-sans font-bold text-sm text-charcoal group-hover/item:text-gold transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-sans text-xs text-charcoal/65 block mt-0.5 leading-relaxed">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-charcoal/40 group-hover/item:text-gold group-hover/item:translate-x-1 transition-all text-xs pt-0.5" aria-hidden="true">
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
                      <span>{dict.nav?.todasPublicaciones}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Asociación: Direct Link to /asociacion + Dropdown Toggle */}
          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('asociacion')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className={`h-full flex items-center transition-colors ${
              activeDropdown === 'asociacion'
                ? 'text-charcoal border-b-2 border-charcoal font-bold'
                : 'text-charcoal/80 hover:text-charcoal'
            }`}>
              <Link
                href={`/${lang}/asociacion`}
                className="h-full pl-3.5 pr-1 xl:pl-4 xl:pr-1.5 flex items-center text-sm font-semibold tracking-wide"
              >
                {dict.nav?.asociacion}
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('asociacion');
                }}
                className="h-full pr-3 text-charcoal/60 hover:text-charcoal flex items-center"
                aria-label={dict.nav?.asociacion}
                aria-expanded={activeDropdown === 'asociacion'}
              >
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'asociacion' ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            </div>

            {activeDropdown === 'asociacion' && (
              <div className="absolute top-full left-0 w-[380px] bg-parchment border border-lines shadow-2xl z-50 animate-appear-instant">
                <div className="p-2 flex flex-col">
                  {asociacionItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3.5 hover:bg-surface border-b border-lines/40 last:border-0 transition-colors group/item flex items-start justify-between"
                    >
                      <div>
                        <span className="font-sans font-bold text-sm text-charcoal group-hover/item:text-gold transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-sans text-xs text-charcoal/65 block mt-0.5 leading-relaxed">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-charcoal/40 group-hover/item:text-gold group-hover/item:translate-x-1 transition-all text-xs pt-0.5" aria-hidden="true">
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
                      <span>{dict.nav?.conoceAsociacion}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Autores Dropdown */}
          <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('autores')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div className={`h-full flex items-center transition-colors ${
              activeDropdown === 'autores'
                ? 'text-charcoal border-b-2 border-charcoal font-bold'
                : 'text-charcoal/80 hover:text-charcoal'
            }`}>
              <Link
                href={`/${lang}/autores`}
                className="h-full pl-3.5 pr-1 xl:pl-4 xl:pr-1.5 flex items-center text-sm font-semibold tracking-wide"
              >
                {dict.nav?.autores}
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('autores');
                }}
                className="h-full pr-3 text-charcoal/60 hover:text-charcoal flex items-center"
                aria-label={dict.nav?.autores}
                aria-expanded={activeDropdown === 'autores'}
              >
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'autores' ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            </div>

            {activeDropdown === 'autores' && (
              <div className="absolute top-full left-0 w-[360px] bg-parchment border border-lines shadow-2xl z-50 animate-appear-instant">
                <div className="p-2 flex flex-col">
                  {autoresItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3.5 hover:bg-surface border-b border-lines/40 last:border-0 transition-colors group/item flex items-start justify-between"
                    >
                      <div>
                        <span className="font-sans font-bold text-sm text-charcoal group-hover/item:text-gold transition-colors block">
                          {item.title}
                        </span>
                        <span className="font-sans text-xs text-charcoal/65 block mt-0.5 leading-relaxed">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-charcoal/40 group-hover/item:text-gold group-hover/item:translate-x-1 transition-all text-xs pt-0.5" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  ))}
                  <div className="pt-2 px-3 pb-2 border-t border-lines mt-1">
                    <Link
                      href={`/${lang}/autores`}
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold uppercase tracking-[0.16em] text-charcoal hover:text-gold flex items-center justify-between py-1 transition-colors"
                    >
                      <span>{dict.nav?.todosAutores}</span>
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
            className={`h-full px-3.5 xl:px-4 flex items-center text-sm font-semibold tracking-wide transition-colors ${
              pathname?.includes('/noticias')
                ? 'text-charcoal border-b-2 border-charcoal font-bold'
                : 'text-charcoal/80 hover:text-charcoal'
            }`}
          >
            {dict.nav?.noticias}
          </Link>

          {/* 5. Contactar (Direct Link) */}
          <Link
            href={`/${lang}/contacto`}
            className={`h-full px-3.5 xl:px-4 flex items-center text-sm font-semibold tracking-wide transition-colors ${
              pathname?.includes('/contacto')
                ? 'text-charcoal border-b-2 border-charcoal font-bold'
                : 'text-charcoal/80 hover:text-charcoal'
            }`}
          >
            {dict.nav?.contactar || 'Contactar'}
          </Link>

        </div>

        {/* ==================================================== */}
        {/* RIGHT CONTROLS: LANG, THEME, USER */}
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
              title={dict.nav?.escritorio}
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
              title={dict.nav?.login}
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </Link>
          )}
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
            aria-label={mobileMenuOpen ? (dict.nav?.closeMenu || 'Pechar menú') : (dict.nav?.toggleMenu || 'Abrir menú')}
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
        <div className="lg:hidden absolute top-full left-0 right-0 h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] bg-parchment dark:bg-[#121212] z-[999] overflow-y-auto border-t border-lines flex flex-col justify-between p-6 shadow-2xl">
          <div className="flex flex-col gap-6">
            
            {/* 1. Publicacións: Direct Link + Accordion Chevron */}
            <div className="border-b border-lines pb-4">
              <div className="w-full flex items-center justify-between text-xl font-serif font-bold text-charcoal py-2">
                <Link
                  href={`/${lang}/articulos`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold transition-colors"
                >
                  {dict.nav?.publicaciones}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion('publicacions')}
                  className="p-1 text-charcoal/70"
                  aria-label={dict.dashboard?.expandSidebar || 'Expandir'}
                >
                  <span className={`material-symbols-outlined transition-transform ${mobileExpanded['publicacions'] ? 'rotate-180 text-gold' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
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
                    {dict.nav?.verTodoArquivo}
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Asociación: Direct Link + Accordion Chevron */}
            <div className="border-b border-lines pb-4">
              <div className="w-full flex items-center justify-between text-xl font-serif font-bold text-charcoal py-2">
                <Link
                  href={`/${lang}/asociacion`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold transition-colors"
                >
                  {dict.nav?.asociacion}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion('asociacion')}
                  className="p-1 text-charcoal/70"
                  aria-label={dict.dashboard?.expandSidebar || 'Expandir'}
                >
                  <span className={`material-symbols-outlined transition-transform ${mobileExpanded['asociacion'] ? 'rotate-180 text-gold' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
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
                    {dict.nav?.conoceAsociacion} →
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Autores: Direct Link + Accordion Chevron */}
            <div className="border-b border-lines pb-4">
              <div className="w-full flex items-center justify-between text-xl font-serif font-bold text-charcoal py-2">
                <Link
                  href={`/${lang}/autores`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold transition-colors"
                >
                  {dict.nav?.autores}
                </Link>
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion('autores')}
                  className="p-1 text-charcoal/70"
                  aria-label={dict.dashboard?.expandSidebar || 'Expandir'}
                >
                  <span className={`material-symbols-outlined transition-transform ${mobileExpanded['autores'] ? 'rotate-180 text-gold' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
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
                    href={`/${lang}/autores`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest text-gold pt-2"
                  >
                    {dict.nav?.todosAutores} →
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Noticias (Direct Link) */}
            <div className="border-b border-lines pb-4">
              <Link
                href={`/${lang}/noticias`}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xl font-serif font-bold py-2 block ${
                  pathname?.includes('/noticias') ? 'text-gold' : 'text-charcoal hover:text-gold'
                }`}
              >
                {dict.nav?.noticiasYAvisos}
              </Link>
            </div>

            {/* 5. Contactar (Direct Link) */}
            <div className="border-b border-lines pb-4">
              <Link
                href={`/${lang}/contacto`}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xl font-serif font-bold py-2 block ${
                  pathname?.includes('/contacto') ? 'text-gold' : 'text-charcoal hover:text-gold'
                }`}
              >
                {dict.nav?.contactar}
              </Link>
            </div>

            {/* 6. Escritorio / Perfil */}
            <div className="border-b border-lines pb-4">
              <Link
                href={user ? `/${lang}/escritorio` : `/${lang}/login`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-serif font-bold text-charcoal hover:text-gold py-2 flex items-center justify-between"
              >
                <span>{user ? dict.nav?.escritorio : dict.nav?.login}</span>
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>

          </div>

        </div>
      )}
    </header>
  );
}
