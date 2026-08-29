import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export function EstatutosMarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    h2: ({ ...props }) => {
      const text = props.children?.toString() || '';
      const parts = text.split('|');
      if (parts.length === 2) {
        return (
          <h2 className="mt-20 first:mt-0 mb-14 pb-6 border-b-2 border-lines text-center scroll-mt-8">
            <span className="block font-sans text-xs font-semibold text-gold tracking-[0.35em] uppercase mb-3">
              {parts[0]}
            </span>
            <span className="block font-serif text-3xl md:text-4xl text-charcoal font-normal">
              {parts[1]}
            </span>
          </h2>
        );
      }
      return (
        <h2 className="mt-20 first:mt-0 mb-14 pb-6 border-b-2 border-lines text-center scroll-mt-8 block font-serif text-3xl md:text-4xl text-charcoal font-normal">
          {text}
        </h2>
      );
    },
    h3: ({ ...props }) => (
      <h3 className="font-serif text-xl md:text-[1.375rem] text-charcoal font-semibold mb-6 pb-3 border-b border-lines/60 mt-14 scroll-mt-8" {...props} />
    ),
    p: ({ ...props }) => {
      
      // We had type L and M before, but let's just render standard P since it's just paragraphs now.
      return <p className="mb-7 text-justify hyphens-auto" {...props} />;
    },
    li: ({ ...props }) => <li className="text-charcoal/90 leading-[1.8]" {...props} />,
    ul: ({ ...props }) => <ul className="mb-8 text-justify hyphens-auto list-none space-y-5 pl-4 md:pl-8" {...props} />,
    ol: ({ ...props }) => <ol className="mb-8 text-justify hyphens-auto list-decimal space-y-5 pl-6 md:pl-10 marker:text-gold marker:font-semibold" {...props} />
  };

  return (
    <div className="text-charcoal/85 font-serif text-[1.15rem] md:text-xl leading-[1.95] max-w-full">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
