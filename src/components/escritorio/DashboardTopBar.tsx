import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, DEFAULT_AVATAR_URL } from '@/lib/constants';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface DashboardTopBarProps {
  avatarUrl?: string | null;
  role?: string;
}

export default function DashboardTopBar({ avatarUrl, role }: DashboardTopBarProps) {
  const rolTexto = role === 'admin' ? 'ADMIN' : role === 'escritor' ? 'ESCRITOR' : role === 'invitado' ? 'INVITADO' : 'LECTOR';

  return (
    <header className="w-full sticky top-0 bg-surface flex justify-between items-center h-16 z-40 border-b border-lines px-5 md:px-16 shrink-0">
      <div className="flex items-center gap-8">
        <span className="font-serif text-3xl text-charcoal">{SITE_NAME}</span>
      </div>
      <div className="flex items-center gap-6">
        <ThemeToggle />
        <Link href="/escritorio/perfil" className="flex items-center gap-3 group">
          <span className="font-sans text-[10px] uppercase tracking-widest text-charcoal/50 group-hover:text-gold transition-colors">{rolTexto}</span>
          <div className="w-8 h-8 bg-lines border border-lines overflow-hidden relative rounded-full">
            <Image 
              className="object-cover" 
              alt="Profile" 
              src={avatarUrl || DEFAULT_AVATAR_URL} 
              fill 
              sizes="32px" 
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
