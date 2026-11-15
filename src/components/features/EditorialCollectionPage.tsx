import React from 'react';
import type { Metadata } from 'next';
import { resolveLocale } from '@/i18n-config';
import { SITE_NAME } from '@/lib/constants';
import { getDocument } from '@/lib/content';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export type EditorialCollectionSlug =
  | 'coleccion-articulos'
  | 'coleccion-ensayos'
  | 'coleccion-narrativa'
  | 'coleccion-poesia';

interface CollectionFrontmatter {
  title?: string;
  responsable?: string;
  correo?: string;
  documento?: string;
}

/**
 * Generates localized metadata from a collection markdown document's frontmatter.
 */
export async function createCollectionMetadata(
  slug: EditorialCollectionSlug,
  lang: string
): Promise<Metadata> {
  const locale = resolveLocale(lang);
  const { data } = getDocument(slug, locale);
  const { title, responsable } = data as CollectionFrontmatter;

  if (!title) {
    return { title: SITE_NAME };
  }

  return {
    title: `${title} | ${SITE_NAME}`,
    ...(responsable ? { description: responsable } : {}),
  };
}

interface EditorialCollectionPageProps {
  slug: EditorialCollectionSlug;
  lang: string;
}

/**
 * Shared editorial collection page rendering localized collection guidelines from markdown.
 */
export function EditorialCollectionPage({ slug, lang }: EditorialCollectionPageProps) {
  const locale = resolveLocale(lang);
  const { data, content } = getDocument(slug, locale);
  const { title, responsable, correo, documento } = data as CollectionFrontmatter;
  const emailAddress = correo
    ? correo.match(/[^\s:]+@[^\s:]+/)?.[0] || correo.trim()
    : '';

  return (
    <main className="min-h-screen bg-parchment py-12 md:py-24 px-5">
      <article className="max-w-[1100px] mx-auto w-full bg-surface border border-lines shadow-[0_4px_40px_rgba(0,0,0,0.07)] px-8 py-16 md:px-24 md:py-20">
        <header className="mb-12 border-b border-lines pb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-serif text-charcoal mb-4 leading-tight">
            {title}
          </h1>
          <div className="flex flex-col items-center justify-center gap-2 mt-6">
            {responsable && (
              <p className="font-medium font-sans text-charcoal/70 uppercase tracking-widest text-xs md:text-sm">
                {responsable}
              </p>
            )}
            {correo && (
              <a
                href={`mailto:${emailAddress}`}
                className="font-medium font-sans text-gold hover:opacity-80 transition-opacity"
              >
                {correo}
              </a>
            )}
            {documento && (
              <p className="mt-2 text-sm text-charcoal/60 italic">{documento}</p>
            )}
          </div>
        </header>

        <MarkdownRenderer content={content} />
      </article>
    </main>
  );
}
