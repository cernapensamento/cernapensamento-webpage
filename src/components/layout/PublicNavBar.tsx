'use client';

import Link from 'next/link';
import { handleSignOut } from '@/actions/auth';
import { SITE_NAME, DEFAULT_AVATAR_URL } from '@/lib/constants';
import Image from 'next/image';
import BackButton from '@/components/ui/BackButton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useAuth } from '@/hooks/useAuth';

export default function PublicNavBar({ showBackLink = false }: { showBackLink?: boolean }) {
  const { user, profile: userProfile, loading } = useAuth();

  return (
    <nav className="bg-parchment border-b border-lines w-full px-5 md:px-16 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full max-w-[1120px] mx-auto relative min-h-[56px]">
        <div className="flex gap-4 items-center">
          <BackButton />
          {user && (
            <Link href="/escritorio/perfil" className="group w-10 h-10 rounded-full border border-lines overflow-hidden relative block shrink-0" title="Ver Perfil">
              <Image 
                className="object-cover transition-all duration-700" 
                alt="User Avatar" 
                src={userProfile?.avatar_url || DEFAULT_AVATAR_URL} 
                fill 
                sizes="40px" 
              />
            </Link>
          )}
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-80 transition-opacity">
          <Image 
            src="/images/logo/cernawhite.png" 
            alt="Cerna Pensamento" 
            width={400} 
            height={100} 
            className="h-14 md:h-20 w-auto object-contain block dark:hidden"
            priority
          />
          <Image 
            src="/images/logo/cernablack.png" 
            alt="Cerna Pensamento" 
            width={400} 
            height={100} 
            className="h-14 md:h-20 w-auto object-contain hidden dark:block"
            priority
          />
        </Link>
        <div className="flex items-center gap-4 ml-auto">
          {loading ? null : user ? (
            <>
              {(userProfile?.rol === 'escritor' || userProfile?.rol === 'admin' || userProfile?.rol === 'invitado') && (
                <Link
                  href="/escritorio"
                  title="Ir al Escritorio"
                  className="group bg-charcoal text-parchment hover:bg-gold hover:text-charcoal p-3 md:p-2.5 transition-all duration-500 ease-out border border-charcoal hover:border-gold fixed bottom-6 right-5 md:static shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_40px_rgba(197,160,89,0.4)] md:shadow-none md:hover:shadow-none rounded-full z-50 flex items-center justify-center hover:-translate-y-1 md:hover:-translate-y-0 active:scale-95 md:active:scale-100"
                >
                  <span className="material-symbols-outlined text-[20px] transition-transform duration-500 group-hover:rotate-12">edit</span>
                </Link>
              )}

              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="font-sans text-xs font-semibold text-charcoal/60 hover:text-red-700 transition-colors duration-300 uppercase tracking-wider cursor-pointer"
                >
                  Saír
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="font-sans text-xs font-semibold bg-charcoal text-parchment hover:bg-gold hover:text-parchment px-4 py-2 transition-all duration-300 uppercase tracking-wider border border-charcoal hover:border-gold">
                Acceder
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
