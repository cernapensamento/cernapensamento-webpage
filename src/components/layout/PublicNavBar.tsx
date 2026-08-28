'use client';

import Link from 'next/link';
import Image from 'next/image';
import BackButton from '@/components/ui/BackButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SideMenu from '@/components/layout/SideMenu';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

export default function PublicNavBar({ 
  showBackLink = false 
}: { 
  showBackLink?: boolean;
}) {
  const { user, profile: userProfile, loading } = useAuth();
  const lang = useLocale();
  const dict = getDictionaryClient(lang);

  return (
    <nav className="bg-parchment border-b border-lines w-full px-5 md:px-16 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full max-w-[1120px] mx-auto relative min-h-[56px]">
        
        {/* Left Section: Menu, Theme, Back */}
        <div className="flex gap-3 items-center flex-1">
          <SideMenu />
          <div className="fixed bottom-6 right-6 z-50 md:static md:bottom-auto md:right-auto md:z-auto shadow-2xl md:shadow-none rounded-none">
            <ThemeToggle />
          </div>
          {showBackLink && <BackButton />}
        </div>

        {/* Center Section: Logo */}
        <Link href={`/${lang}`} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-80 transition-opacity">
          <Image 
            src="/images/logo/cernawhite.png" 
            alt="Cerna Pensamento" 
            width={400} 
            height={100} 
            className="h-12 md:h-16 w-auto object-contain block dark:hidden"
            priority
          />
          <Image 
            src="/images/logo/cernablack.png" 
            alt="Cerna Pensamento" 
            width={400} 
            height={100} 
            className="h-12 md:h-16 w-auto object-contain hidden dark:block"
            priority
          />
        </Link>
        
        {/* Right Section: Login / Avatar */}
        <div className="flex items-center justify-end gap-3 md:gap-4 flex-1">
          {!loading && user ? (
            <Link 
              href={`/${lang}/escritorio`}
              className="p-2 border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300 flex items-center justify-center w-10 h-10 shadow-lg relative overflow-hidden rounded-full"
              title={dict.nav.escritorio}
            >
              {userProfile?.avatar_url ? (
                <Image className="object-cover" alt="Tu Perfil" src={userProfile.avatar_url} fill sizes="40px" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">person</span>
              )}
            </Link>
          ) : !loading && (
            <Link href={`/${lang}/login`} className="p-2 border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300 flex items-center justify-center w-10 h-10 shadow-lg" title={dict.nav.login}>
              <span className="material-symbols-outlined text-[20px] leading-none">person</span>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
