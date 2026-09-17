import React from 'react';

interface SocialLinksProps {
  className?: string;
  itemClassName?: string;
}

interface SocialItem {
  href: string;
  label: string;
  isExternal: boolean;
  icon: React.ReactNode;
}

const SOCIAL_ITEMS: SocialItem[] = [
  {
    href: 'mailto:contacto@cernapensamento.org',
    label: 'Contacto por Correo',
    isExternal: false,
    icon: <span className="material-symbols-outlined text-[22px]" aria-hidden="true">mail</span>,
  },
  {
    href: 'https://www.instagram.com/cernapensamento',
    label: 'Instagram',
    isExternal: true,
    icon: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="22" 
        height="22" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
  },
  {
    href: 'https://www.linkedin.com/company/cerna-pensamento/',
    label: 'LinkedIn',
    isExternal: true,
    icon: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="22" 
        height="22" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden="true"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
        <rect x="2" y="9" width="4" height="12"></rect>
        <circle cx="4" cy="4" r="2"></circle>
      </svg>
    ),
  },
];

export default function SocialLinks({
  className = 'flex items-center gap-4',
  itemClassName = 'bg-surface hover:shadow-sm',
}: SocialLinksProps) {
  return (
    <div className={className}>
      {SOCIAL_ITEMS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          {...(item.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={`w-12 h-12 flex items-center justify-center border border-lines rounded-full text-charcoal hover:text-gold hover:border-gold transition-all duration-300 ${itemClassName}`}
          aria-label={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
