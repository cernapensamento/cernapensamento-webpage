import React from 'react';

interface UnderConstructionBlockProps {
  title?: string;
  text?: string;
  dict: any;
}

export default function UnderConstructionBlock({ title, text, dict }: UnderConstructionBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 md:py-32 px-6 text-center max-w-2xl mx-auto">
      <div className="mb-8 text-gold animate-pulse">
        <span className="material-symbols-outlined text-7xl md:text-8xl" aria-hidden="true">construction</span>
      </div>
      
      <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6 leading-tight">
        {title || dict.wip.title}
      </h1>
      
      <p className="font-sans text-charcoal/70 text-lg md:text-xl leading-relaxed">
        {text || dict.wip.default_text}
      </p>
      
      <div className="w-16 h-0.5 bg-gold/50 mx-auto mt-12" />
    </div>
  );
}
