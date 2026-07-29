'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { SITE_NAME, DEFAULT_AVATAR_URL } from '@/lib/constants';
import ThemeToggle from '@/components/ui/ThemeToggle';
import esDict from '@/dictionaries/es.json';
import glDict from '@/dictionaries/gl.json';

interface DashboardTopBarProps {
  avatarUrl?: string | null;
  role?: string;
}

export default function DashboardTopBar({ avatarUrl, role }: DashboardTopBarProps) {
  const params = useParams();
  const lang = (params?.lang as string) || 'es';
  const dict = lang === 'es' ? esDict : glDict;
  const dashDict = dict.dashboard;

  const rolTexto = role === 'admin' ? dashDict.admin : role === 'escritor' ? dashDict.writer : role === 'invitado' ? dashDict.guest : dashDict.reader;

  return (
    <header className="w-full sticky top-0 bg-surface flex justify-between items-center h-16 z-40 border-b border-lines px-5 md:px-16 shrink-0">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center justify-center hover:opacity-80 transition-opacity">
          <Image 
            src="/images/logo/cernawhite.png" 
            alt={SITE_NAME} 
            width={400} 
            height={100} 
            className="h-10 w-auto object-contain block dark:hidden"
            priority
          />
          <Image 
            src="/images/logo/cernablack.png" 
            alt={SITE_NAME} 
            width={400} 
            height={100} 
            className="h-10 w-auto object-contain hidden dark:block"
            priority
          />
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <ThemeToggle />
        <Link href={`/${lang}/escritorio/perfil`} className="flex items-center gap-3 group">
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
