import React from 'react';
import Link from 'next/link';

interface DraftItemProps {
  title: string;
  editedAgo: string;
}

export default function DraftItem({ title, editedAgo }: DraftItemProps) {
  return (
    <div className="group cursor-pointer">
      <div className="flex items-center gap-4 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-gold/50 group-hover:bg-gold transition-colors duration-300"></span>
        <h4 className="font-serif text-lg text-charcoal group-hover:text-gold transition-colors duration-300">{title}</h4>
      </div>
      <div className="pl-5.5 flex items-center justify-between">
        <span className="font-sans text-xs text-charcoal/50 italic tracking-wide">Editado hace {editedAgo}</span>
        <Link href="/escritorio/nuevo" className="font-sans text-[10px] uppercase tracking-widest text-charcoal/40 group-hover:text-charcoal transition-colors">Continuar</Link>
      </div>
    </div>
  );
}
