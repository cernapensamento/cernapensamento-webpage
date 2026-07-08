'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-lines z-50">
      <div className="px-8 py-10 flex flex-col h-full">
        <div className="mb-12">
          <h1 className="font-serif text-2xl text-charcoal">Escritorio</h1>
          <p className="font-sans text-xs text-charcoal/60 uppercase tracking-widest mt-1">Panel de Control</p>
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
          <Link
            className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 group rounded-none ${
              pathname === '/escritorio/estadisticas'
                ? 'text-charcoal bg-parchment border-l-2 border-gold'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-lines/30 border-l-2 border-transparent'
            }`}
            href="#"
          >
            <span className={`material-symbols-outlined text-[20px] transition-all duration-300 ${pathname === '/escritorio/estadisticas' ? 'text-gold' : 'text-charcoal/50 group-hover:text-gold group-hover:scale-110'}`} data-icon="query_stats">query_stats</span>
            <span className={`font-sans text-xs uppercase tracking-[0.15em] transition-transform duration-300 ${pathname === '/escritorio/estadisticas' ? 'font-semibold' : 'group-hover:translate-x-1'}`}>Estadísticas</span>
          </Link>
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
          <Link href="/escritorio/nuevo" className="block text-center w-full bg-charcoal text-parchment py-4 px-6 font-sans text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 hover:bg-gold hover:tracking-[0.25em] active:scale-[0.98] mb-8 rounded-none cursor-pointer">
            Publicar ahora
          </Link>
          <Link className="flex items-center gap-4 py-3 px-4 text-charcoal/50 hover:text-charcoal transition-all duration-300 group rounded-none" href="#">
            <span className="material-symbols-outlined text-[20px] text-charcoal/50 transition-all duration-300 group-hover:text-red-500 group-hover:translate-x-[-2px]" data-icon="logout">logout</span>
            <span className="font-sans text-xs uppercase tracking-[0.15em] transition-colors duration-300 group-hover:text-red-500">Cerrar Sesión</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
