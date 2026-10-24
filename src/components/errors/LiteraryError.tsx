'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import { getDictionaryClient } from '@/dictionaries/client';

export type ErrorCode = '400' | '401' | '403' | '404' | '500';

interface ErrorContent {
  title: string;
  description: string;
  actionText: string;
}

interface LiteraryErrorProps {
  code: ErrorCode;
  onAction?: () => void;
  actionHref?: string;
  dict?: ErrorContent;
}

export function LiteraryError({
  code,
  onAction,
  actionHref,
  dict: customDict,
}: LiteraryErrorProps) {
  const lang = useLocale();
  const globalDict = getDictionaryClient(lang);
  
  const dictErrors = globalDict.errors as Record<ErrorCode, ErrorContent> | undefined;
  const content: ErrorContent = customDict || dictErrors?.[code] || {
    title: code === '404' 
      ? (lang === 'es' ? 'Página Extraviada' : 'Páxina Extraviada')
      : (lang === 'es' ? 'Error' : 'Erro'),
    description: lang === 'es' 
      ? 'Ha ocurrido un error inesperado en nuestros servidores.'
      : 'Ocorreu un erro inesperado nos nosos servidores.',
    actionText: lang === 'es' ? 'Volver al Inicio' : 'Volver ao Inicio',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-parchment text-charcoal font-sans w-full">
      {/* Decorative typography background */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-charcoal">
        <span className="font-serif text-[40vw] leading-none font-bold">{code}</span>
      </div>
      
      <div className="max-w-xl w-full border border-lines bg-surface p-10 md:p-16 text-center relative z-10 shadow-sm">
        <h1 className="font-serif text-6xl md:text-7xl text-charcoal mb-2 tracking-tighter">
          {code.split('').map((char, i) => (
            char === '0' ? <span key={i} className="text-gold italic">{char}</span> : char
          ))}
        </h1>
        
        <div className="w-16 h-px bg-lines mx-auto my-6 relative" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border border-gold bg-surface"></div>
        </div>
        
        <h2 className="font-serif text-2xl text-charcoal mb-4">
          {content.title}
        </h2>
        
        <p className="font-sans text-charcoal/70 mb-10 leading-relaxed">
          {content.description}
        </p>
        
        {actionHref ? (
          <a
            href={actionHref}
            className="group inline-block px-8 py-4 bg-charcoal text-parchment font-sans text-xs font-semibold uppercase tracking-widest hover:bg-gold hover:text-charcoal transition-colors duration-300"
          >
            {content.actionText}
          </a>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="group inline-block px-8 py-4 bg-charcoal text-parchment font-sans text-xs font-semibold uppercase tracking-widest hover:bg-gold hover:text-charcoal transition-colors duration-300 cursor-pointer"
          >
            {content.actionText}
          </button>
        ) : null}
      </div>
    </div>
  );
}
