'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { handleSignOut } from '@/app/actions';
import Image from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';

interface SideNavBarProps {
  role?: string;
  avatarUrl?: string | null;
}

export default function SideNavBar({ role, avatarUrl }: SideNavBarProps) {
  const pathname = usePathname();

  const isWriter = role === 'escritor' || role === 'admin';

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-lines z-50">
      <div className="px-8 py-10 flex flex-col h-full">
        <div className="mb-12">
          <Link href="/escritorio/perfil" className="flex items-center gap-4 mb-6 group">
            <div className="w-12 h-12 bg-lines border border-lines overflow-hidden relative rounded-full shrink-0">
              <Image
                className="object-cover transition-all duration-700 group-hover:opacity-80"
                alt="Profile"
                src={avatarUrl || DEFAULT_AVATAR_URL}
                fill
                sizes="48px"
              />
            </div>
            <div>
              <h1 className="font-serif text-xl text-charcoal group-hover:text-gold transition-colors">Escritorio</h1>
              <p className="font-sans text-[10px] text-charcoal/60 uppercase tracking-widest mt-0.5">Panel de Control</p>
            </div>
          </Link>
        </div>
        <nav className="flex-grow space-y-1">
          <Link
            className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
              pathname === '/' 
                ? 'text-charcoal bg-parchment border-l-2 border-gold' 
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href="/"
          >
            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="home" style={{ fontFamily: 'Material Symbols Outlined' }}>home</span>
            <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>Volver al Inicio</span>
          </Link>
          {isWriter && (
            <>
              <Link
                className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
                  pathname === '/escritorio'
                    ? 'text-charcoal bg-parchment border-l-2 border-gold'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
                }`}
                href="/escritorio"
              >
                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="description">description</span>
                <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>Mis Artículos</span>
              </Link>
              <Link
                className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
                  pathname === '/escritorio/nuevo'
                    ? 'text-charcoal bg-parchment border-l-2 border-gold'
                    : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
                }`}
                href="/escritorio/nuevo"
              >
                <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio/nuevo' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="edit_note">edit_note</span>
                <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio/nuevo' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>Nuevo Artículo</span>
              </Link>
            </>
          )}
          <Link
            className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
              pathname === '/escritorio/perfil'
                ? 'text-charcoal bg-parchment border-l-2 border-gold'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href="/escritorio/perfil"
          >
            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio/perfil' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="person">person</span>
            <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio/perfil' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>Perfil</span>
          </Link>
        </nav>
        <div className="mt-auto pt-8 border-t border-lines">
          {/* Removed Publicar ahora block */}
          <form action={handleSignOut}>
            <button type="submit" className="flex items-center gap-4 py-3 px-4 text-charcoal/50 hover:text-charcoal transition-all duration-300 group rounded-none w-full cursor-pointer">
              <span className="material-symbols-outlined text-[20px] text-charcoal/50 transition-all duration-300 group-hover:text-red-500 group-hover:translate-x-[-2px]" data-icon="logout">logout</span>
              <span className="font-sans text-xs uppercase tracking-[0.15em] transition-colors duration-300 group-hover:text-red-500">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
