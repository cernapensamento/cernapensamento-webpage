import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  showListMarkers?: boolean;
}

export function LegalDocumentMarkdownRenderer({
  content,
  showListMarkers = false,
}: MarkdownRendererProps) {
  const components: Components = {
    h2: ({ ...props }) => {
      const text = props.children?.toString() || '';
      const parts = text.split('|');
      if (parts.length === 2) {
        return (
          <h2 className="mt-14 first:mt-0 mb-10 border-b-2 border-lines pb-6 text-center scroll-mt-8 md:mt-20 md:mb-14">
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
        <h2 className="mt-14 first:mt-0 mb-10 block border-b-2 border-lines pb-6 text-center font-serif text-3xl font-normal text-charcoal scroll-mt-8 md:mt-20 md:mb-14 md:text-4xl">
          {text}
        </h2>
      );
    },
    h3: ({ ...props }) => (
      <h3 className="mt-10 mb-5 border-b border-lines/60 pb-3 font-serif text-xl font-semibold text-charcoal scroll-mt-8 md:mt-14 md:mb-6 md:text-[1.375rem]" {...props} />
    ),
    p: ({ ...props }) => {
      // We had type L and M before, but let's just render standard P since it's just paragraphs now.
      return (
        <p
          className="mb-6 text-left hyphens-none md:mb-7 md:text-justify md:hyphens-auto"
          {...props}
        />
      );
    },
    a: ({ ...props }) => (
      <a
        className="text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold transition-colors"
        {...props}
      />
    ),
    strong: ({ ...props }) => <strong className="font-semibold text-charcoal" {...props} />,
    code: ({ ...props }) => (
      <code className="font-mono text-[0.85em] text-charcoal bg-lines/40 px-1.5 py-0.5" {...props} />
    ),
    li: ({ ...props }) => <li className="text-charcoal/90 leading-[1.8]" {...props} />,
    ul: ({ ...props }) => (
      <ul
        className={`mb-7 space-y-4 text-left md:mb-8 md:space-y-5 ${
          showListMarkers
            ? 'list-disc pl-6 md:pl-10 marker:text-gold'
            : 'list-none pl-4 md:pl-8'
        }`}
        {...props}
      />
    ),
    ol: ({ ...props }) => <ol className="mb-7 list-decimal space-y-4 pl-6 text-left marker:font-semibold marker:text-gold md:mb-8 md:space-y-5 md:pl-10" {...props} />
  };

  return (
    <div className="mx-auto max-w-[780px] font-serif text-[1.05rem] leading-[1.85] text-charcoal/85 md:text-xl md:leading-[1.95]">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
