import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { handleSignOut } from '@/app/actions';
import { SITE_NAME, DEFAULT_AVATAR_URL } from '@/lib/constants';
import Image from 'next/image';
import BackButton from '@/components/BackButton';

export default async function PublicNavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol, avatar_url')
      .eq('id', user.id)
      .single();
    userProfile = profile;
  }

  return (
    <nav className="bg-parchment border-b border-lines w-full px-5 md:px-16 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full max-w-[1120px] mx-auto relative h-[42px]">
        <div className="flex gap-4 items-center w-24">
          <BackButton />
          <Link href={user ? "/escritorio/perfil" : "/login"} className="w-10 h-10 rounded-full border border-lines overflow-hidden relative block shrink-0" title={user ? "Ver Perfil" : "Iniciar Sesión"}>
            <Image 
              className="object-cover grayscale" 
              alt="User Avatar" 
              src={userProfile?.avatar_url || DEFAULT_AVATAR_URL} 
              fill 
              sizes="40px" 
            />
          </Link>
        </div>
        <Link href="/" className="font-serif text-3xl md:text-4xl text-charcoal tracking-tighter absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {SITE_NAME}
        </Link>
        <div className="flex items-center gap-4 ml-auto">
          {user ? (
            <>
              {(userProfile?.rol === 'escritor' || userProfile?.rol === 'admin') && (
                <Link
                  href="/escritorio"
                  className="font-sans text-xs font-semibold bg-charcoal text-parchment hover:bg-gold hover:text-parchment px-4 py-2 transition-all duration-300 uppercase tracking-wider border border-charcoal hover:border-gold"
                >
                  Ir al Escritorio
                </Link>
              )}
              {userProfile?.rol === 'usuario' && (
                <Link href="/escritorio/perfil" className="font-sans text-xs font-semibold text-charcoal/85 hover:text-gold transition-colors uppercase tracking-wider hidden md:inline-flex items-center">
                  Lector
                </Link>
              )}
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="font-sans text-xs font-semibold text-charcoal/60 hover:text-red-700 transition-colors duration-300 uppercase tracking-wider cursor-pointer"
                >
                  Salir
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
