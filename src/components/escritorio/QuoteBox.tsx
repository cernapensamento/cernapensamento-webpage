import React from 'react';

interface QuoteBoxProps {
  quote: string;
  author: string;
}

export default function QuoteBox({ quote, author }: QuoteBoxProps) {
  return (
    <div className="bg-charcoal text-parchment p-8 mt-12 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gold transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out"></div>
      <span className="absolute -top-4 -left-2 text-[120px] font-serif text-parchment/10 leading-none select-none">"</span>
      <p className="font-serif text-xl italic relative z-10">"{quote}"</p>
      <p className="font-sans text-xs uppercase tracking-[0.2em] mt-6 text-parchment/60 relative z-10">— {author}</p>
    </div>
  );
}
