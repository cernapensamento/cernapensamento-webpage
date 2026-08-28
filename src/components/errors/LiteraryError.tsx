'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type ErrorCode = '400' | '401' | '403' | '404' | '500';

interface LiteraryErrorProps {
  code: ErrorCode;
  onAction?: () => void;
  actionHref?: string;
}

const errorCopy = {
  '404': {
    es: { title: "Página Extraviada", description: "El documento que buscas no existe en nuestros archivos o ha sido retirado.", actionText: "Retornar a la Portada" },
    gl: { title: "Páxina Extraviada", description: "O documento que buscas non existe nos nosos arquivos ou foi retirado.", actionText: "Retornar á Portada" }
  },
  '500': {
    es: { title: "Error de Sistema", description: "Ha ocurrido un error inesperado. Nuestros editores han sido notificados.", actionText: "Reintentar" },
    gl: { title: "Erro de Sistema", description: "Ocorreu un erro inesperado. Os nosos editores foron notificados.", actionText: "Reintentar" }
  },
  '403': {
    es: { title: "Acceso Denegado", description: "No tienes permiso para acceder a este documento.", actionText: "Volver al Inicio" },
    gl: { title: "Acceso Denegado", description: "Non tes permiso para acceder a este documento.", actionText: "Volver ao Inicio" }
  },
  '401': {
    es: { title: "Identidad Requerida", description: "Debes iniciar sesión para acceder a estos archivos.", actionText: "Identificarse" },
    gl: { title: "Identidade Requirida", description: "Debes iniciar sesión para acceder a estes arquivos.", actionText: "Identificarse" }
  },
  '400': {
    es: { title: "Petición Inválida", description: "La solicitud enviada no puede ser procesada.", actionText: "Volver al Inicio" },
    gl: { title: "Petición Inválida", description: "A solicitude enviada non pode ser procesada.", actionText: "Volver ao Inicio" }
  }
};

export function LiteraryError({
  code,
  onAction,
  actionHref
}: LiteraryErrorProps) {
  const pathname = usePathname();
  const [lang, setLang] = useState<'es' | 'gl'>('es');

  useEffect(() => {
    // pathname can be null in some error boundaries, default to es
    if (pathname && pathname.startsWith('/gl')) {
      setLang('gl');
    } else {
      setLang('es');
    }
  }, [pathname]);

  const content = errorCopy[code][lang];

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
