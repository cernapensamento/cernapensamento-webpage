import Link from 'next/link';
import Image from 'next/image';

interface DashboardTopBarProps {
  avatarUrl?: string | null;
}

export default function DashboardTopBar({ avatarUrl }: DashboardTopBarProps) {
  return (
    <header className="w-full sticky top-0 bg-surface flex justify-between items-center h-16 z-40 border-b border-lines px-5 md:px-16 shrink-0">
      <div className="flex items-center gap-8">
        <span className="font-serif text-3xl text-charcoal">El Dialecto</span>
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
              src={avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuC7MT8I4iJi9oaz-ksmXZBKh9UdGvkYVLwMQvSpWs9EQyAD8rZf5DufwmVGUQ5uCG5uahsc3uQgS1NtkA2gUlzCzM7sV8vRDKudibLkyTvoGh1hXKukQlbHvz8mlI21pcRFpkITr6vDRvATOaMXiOWIjlRId-wF2QY98BuCyIww8u67nQ1epKY5YVHh5lKLG26uRN5MnrdT-bNEmArWHpN5lzEK3JphmVfYgfMY116r44VV8L5wZXCaLFuLjZKXaYL3WSpniDP-8V0"} 
              fill 
              sizes="32px" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
