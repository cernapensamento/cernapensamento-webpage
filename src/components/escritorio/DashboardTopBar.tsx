import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, DEFAULT_AVATAR_URL } from '@/lib/constants';

interface DashboardTopBarProps {
  avatarUrl?: string | null;
}

export default function DashboardTopBar({ avatarUrl }: DashboardTopBarProps) {
  return (
    <header className="w-full sticky top-0 bg-surface flex justify-between items-center h-16 z-40 border-b border-lines px-5 md:px-16 shrink-0">
      <div className="flex items-center gap-8">
        <span className="font-serif text-3xl text-charcoal">{SITE_NAME}</span>
        <nav className="hidden md:flex gap-6">
          <Link className="font-sans text-sm tracking-widest text-charcoal/60 hover:text-gold transition-colors" href="/escritorio">Publicaciones</Link>
          <Link className="font-sans text-sm tracking-widest text-charcoal/60 hover:text-gold transition-colors" href="#">Archivo</Link>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="text-charcoal hover:text-gold transition-colors p-1 flex items-center justify-center cursor-pointer group" aria-label="Notificaciones">
            <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:scale-110" data-icon="notifications" style={{ fontFamily: 'Material Symbols Outlined' }}>notifications</span>
          </button>
          <button className="text-charcoal hover:text-gold transition-colors p-1 flex items-center justify-center cursor-pointer group" aria-label="Ajustes">
            <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:rotate-45" data-icon="settings" style={{ fontFamily: 'Material Symbols Outlined' }}>settings</span>
          </button>
          <div className="w-8 h-8 bg-lines border border-lines overflow-hidden relative">
            <Image 
              className="object-cover" 
              alt="Profile" 
              src={avatarUrl || DEFAULT_AVATAR_URL} 
              fill 
              sizes="32px" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
