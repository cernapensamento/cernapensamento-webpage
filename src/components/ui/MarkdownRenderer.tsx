import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ ...props }) => <h1 className="text-3xl md:text-5xl font-bold font-serif text-charcoal mb-6 mt-10 first:mt-0" {...props} />,
    h2: ({ ...props }) => <h2 className="text-2xl md:text-3xl font-semibold mb-4 mt-8 first:mt-0 font-serif text-charcoal" {...props} />,
    h3: ({ ...props }) => <h3 className="text-xl md:text-2xl font-semibold mb-4 mt-6 font-serif text-charcoal" {...props} />,
    p: ({ ...props }) => <p className="leading-relaxed font-sans text-charcoal/80 md:text-lg mb-4 whitespace-pre-wrap" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc pl-6 mb-4 text-charcoal/80 md:text-lg" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-4 text-charcoal/80 md:text-lg" {...props} />,
    li: ({ ...props }) => <li className="mb-2" {...props} />,
    a: ({ ...props }) => <a className="text-gold hover:opacity-80 transition-opacity underline" {...props} />,
    strong: ({ ...props }) => <strong className="font-semibold text-charcoal" {...props} />,
  };

  return (
    <div className="flex flex-col">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
