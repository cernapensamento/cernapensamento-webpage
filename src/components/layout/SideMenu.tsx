'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';
import Image from 'next/image';
import { SITE_NAME } from '@/lib/constants';

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
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

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
        className={`w-10 h-10 relative focus:outline-none z-[60] flex items-center justify-center border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Toggle Menu"
      >
        <div className="block w-5 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span aria-hidden="true" className={`block absolute h-0.5 w-5 bg-current transform transition duration-300 ease-in-out -translate-y-1.5`}></span>
          <span aria-hidden="true" className={`block absolute h-0.5 w-5 bg-current transform transition duration-300 ease-in-out opacity-100`}></span>
          <span aria-hidden="true" className={`block absolute h-0.5 w-5 bg-current transform transition duration-300 ease-in-out translate-y-1.5`}></span>
        </div>
      </button>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-full sm:w-[450px] bg-parchment z-[55] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto border-r border-lines flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header with Logo */}
        <div className="py-2 flex justify-between items-center px-8 sm:px-12 border-b border-lines shrink-0">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity" onClick={() => setIsOpen(false)}>
            <Image 
              src="/images/logo/cernawhite.png" 
              alt={SITE_NAME} 
              width={300} 
              height={75} 
              className="w-50 max-w-full h-auto object-contain block dark:hidden"
              priority
            />
            <Image 
              src="/images/logo/cernablack.png" 
              alt={SITE_NAME} 
              width={300} 
              height={75} 
              className="w-50 max-w-full h-auto object-contain hidden dark:block"
              priority
            />
          </Link>
          <button 
            onClick={() => setIsOpen(false)} 
            className="w-10 h-10 flex shrink-0 focus:outline-none items-center justify-center border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300"
            aria-label="Cerrar Menú"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 pb-12 px-8 sm:px-12 flex flex-col justify-start pt-16">
          <nav className="flex flex-col gap-6">
            
            {!loading && (
              <div className="mb-4">
                <Link 
                  href={user ? `/${lang}/escritorio/perfil` : `/${lang}/login`}
                  className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 inline-block"
                >
                  {user ? dict.nav.escritorio : dict.nav.login}
                </Link>
              </div>
            )}

            <div>
              <Link href={`/${lang}/asociacion`} className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                {dict.nav.asociacion}
              </Link>
            </div>

            <div>
              <Link href={`/${lang}/articulos`} className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                {dict.nav.articulos}
              </Link>
            </div>

            <div>
              <Link href={`/${lang}/colabora`} className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                Colabora
              </Link>
            </div>
            <div>
              <Link href={`/${lang}/noticias`} className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                {dict.nav.noticias}
              </Link>
            </div>

            
            <div>
              <Link href={`/${lang}/contacto`} className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 inline-block">
                Contacto
              </Link>
            </div>

            {/* Accordion for Autores */}
            <div className="flex flex-col">
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setAuthorsOpen(!authorsOpen)}
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setAuthorsOpen(!authorsOpen); }}
                className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight hover:text-gold transition-colors duration-300 text-left inline-flex items-center gap-4 group w-full cursor-pointer outline-none"
              >
                <span className="font-serif">{dict.nav.autores}</span>
                <span className={`material-symbols-outlined text-3xl sm:text-4xl transition-transform duration-300 ${authorsOpen ? 'rotate-180 text-gold' : 'group-hover:text-gold'}`}>
                  expand_more
                </span>
              </div>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${authorsOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <ul className="flex flex-col gap-3 pl-4 border-l-2 border-lines ml-2">
                  {authors.map((author) => (
                    <li key={author.slug}>
                      <Link 
                        href={`/${lang}/autor/${author.slug}`}
                        className="font-serif text-2xl sm:text-3xl tracking-tight text-charcoal/80 hover:text-gold transition-colors duration-300"
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

        {/* Footer of the Sidebar (Contact + Language Toggle) */}
        <div className="p-8 sm:p-12 border-t border-lines mt-auto flex flex-row justify-between items-start">
          
          {/* Contact Section */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-charcoal/50 mb-4 font-sans">{dict.nav.contactar}</h3>
            <div className="flex items-center gap-4 pl-4 border-l-2 border-lines ml-2">
              <a 
                href="mailto:contacto@cernapensamento.org" 
                className="w-12 h-12 flex items-center justify-center border border-lines rounded-full text-charcoal hover:text-gold hover:border-gold transition-colors duration-300 bg-parchment"
                aria-label="Contacto por Correo"
              >
                <span className="material-symbols-outlined text-[22px]">mail</span>
              </a>
              <a 
                href="https://www.instagram.com/cernapensamento" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-lines rounded-full text-charcoal hover:text-gold hover:border-gold transition-colors duration-300 bg-parchment"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Language Section */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-charcoal/50 mb-4 font-sans">{dict.nav.idiomas}</h3>
            <div className="flex items-center pl-4 border-l-2 border-lines ml-2 h-12">
              <LanguageToggle />
            </div>
          </div>
          
        </div>

      </div>
    </>
  );
}
