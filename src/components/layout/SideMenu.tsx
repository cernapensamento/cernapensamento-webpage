'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

export default function SideMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [authorsOpen, setAuthorsOpen] = useState(false);
  const { user, loading } = useAuth();
  const lang = useLocale();
  const pathname = usePathname();
  const dict = getDictionaryClient(lang);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const authors = [
    { name: 'Anxo Pérez', slug: 'anxo-perez' },
    { name: 'Diego Araújo', slug: 'diego-araujo' },
    { name: 'Héctor González', slug: 'hector-gonzalez' },
    { name: 'Denis Fernández', slug: 'denis-fernandez' },
  ];

  return (
    <>
      {/* Hamburger / Close Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-10 h-10 relative focus:outline-none z-[60] flex items-center justify-center border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300"
        aria-label="Toggle Menu"
      >
        <div className="block w-5 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span aria-hidden="true" className={`block absolute h-0.5 w-5 bg-current transform transition duration-300 ease-in-out ${isOpen ? 'rotate-45' : '-translate-y-1.5'}`}></span>
          <span aria-hidden="true" className={`block absolute h-0.5 w-5 bg-current transform transition duration-300 ease-in-out ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span aria-hidden="true" className={`block absolute h-0.5 w-5 bg-current transform transition duration-300 ease-in-out ${isOpen ? '-rotate-45' : 'translate-y-1.5'}`}></span>
        </div>
      </button>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-full sm:w-[450px] bg-parchment z-[55] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto border-r border-lines flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex-1 pt-24 pb-12 px-8 sm:px-12 flex flex-col justify-center">
          <nav className="flex flex-col gap-6">
            
            {!loading && (
              <div className="mb-4">
                <Link 
                  href={user ? `/${lang}/escritorio/perfil` : `/${lang}/login`}
                  className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight hover:text-gold transition-colors duration-300 inline-block"
                >
                  {user ? dict.nav.escritorio : dict.nav.login}
                </Link>
              </div>
            )}

            <div>
              <Link href={`/${lang}/bases-editoriales`} className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                {dict.nav.bases}
              </Link>
            </div>

            <div>
              <Link href={`/${lang}/articulos`} className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                {dict.nav.articulos}
              </Link>
            </div>

            <div>
              <Link href={`/${lang}/estatutos`} className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                {dict.nav.estatutos}
              </Link>
            </div>

            {/* Accordion for Autores */}
            <div className="flex flex-col">
              <button 
                onClick={() => setAuthorsOpen(!authorsOpen)}
                className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight hover:text-gold transition-colors duration-300 text-left flex items-center gap-4 group"
              >
                {dict.nav.autores}
                <span className={`material-symbols-outlined text-3xl sm:text-4xl transition-transform duration-300 ${authorsOpen ? 'rotate-180 text-gold' : 'group-hover:text-gold'}`}>
                  expand_more
                </span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${authorsOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <ul className="flex flex-col gap-3 pl-4 border-l-2 border-lines ml-2">
                  {authors.map((author) => (
                    <li key={author.slug}>
                      <Link 
                        href={`/${lang}/autor/${author.slug}`}
                        className="font-sans text-xl sm:text-2xl text-charcoal/80 hover:text-gold transition-colors duration-300"
                      >
                        {author.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </nav>
        </div>

        {/* Footer of the Sidebar (Language Toggle) */}
        <div className="p-8 sm:p-12 border-t border-lines mt-auto">
          <LanguageToggle />
        </div>

      </div>
    </>
  );
}
