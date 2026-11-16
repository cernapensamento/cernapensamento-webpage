"use client";

import React, { useRef } from 'react';
import NextImage from 'next/image';
import { DEFAULT_AVATAR_URL } from '@/lib/constants';
import { PUBLICATION_TYPES, normalizePublicationType } from '@/lib/db/schema';
import type { Locale } from '@/i18n-config';
import { getDictionaryClient } from '@/dictionaries/client';
import FormattedDate from '@/components/ui/FormattedDate';
import ArticleTableOfContents from '@/components/features/ArticleTableOfContents';
import { getHeadingsFromHtml, stripIndex } from '@/lib/editor/generateIndex';
import { renderMathInHtml } from '@/lib/editor/renderMath';
import { renderHeadingAnchors } from '@/lib/editor/renderHeadingAnchors';
import { sanitizeArticleHtml } from '@/lib/editor/sanitizeArticleHtml';
import { scrollToPreviewHeading } from './articleEditorUtils';

interface ArticlePreviewModalProps {
  routeLang: Locale;
  activeLang: Locale;
  title: string;
  subtitle: string;
  htmlContent: string;
  coverImageUrl: string;
  tags: string[];
  publicationType: string;
  showIndex: boolean;
  authorName: string;
  authorAvatarUrl?: string;
  authorBio: string;
  onClose: () => void;
}

export default function ArticlePreviewModal({
  routeLang,
  activeLang,
  title,
  subtitle,
  htmlContent,
  coverImageUrl,
  tags,
  publicationType,
  showIndex,
  authorName,
  authorAvatarUrl,
  authorBio,
  onClose,
}: ArticlePreviewModalProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const routeEditorDict = getDictionaryClient(routeLang).articleEditor;
  const activeDict = getDictionaryClient(activeLang);
  const previewEditorDict = activeDict.articleEditor;
  const previewArticleDict = activeDict.article;
  const previewDocTypes = activeDict.documentTypes as Record<string, string>;

  const normalizedType = normalizePublicationType(publicationType);
  const typeLabel = previewDocTypes[normalizedType] || publicationType;
  const isEssay = normalizedType === PUBLICATION_TYPES.ESSAY;
  const cleanHtml = stripIndex(htmlContent);
  const previewTocItems = showIndex ? getHeadingsFromHtml(cleanHtml) : [];

  return (
    <div
      ref={previewContainerRef}
      className="fixed inset-0 z-[150] overflow-y-auto bg-parchment animate-in fade-in duration-200"
      onClick={(e) => {
        const target = (e.target as HTMLElement).closest('a');
        if (target?.hash?.startsWith('#')) {
          e.preventDefault();
          scrollToPreviewHeading(previewContainerRef.current, target.hash);
        }
      }}
    >
      <div className="sticky top-0 z-[160] border-b border-lines bg-parchment/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center">
          <button
            type="button"
            className="group flex items-center gap-2 px-4 py-2 border border-lines bg-surface hover:bg-lines/50 text-charcoal font-sans text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
            onClick={onClose}
            title={routeEditorDict.backToEditor}
            aria-label={routeEditorDict.backToEditor}
          >
            <span
              className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-1"
              style={{ fontFamily: 'Material Symbols Outlined' }}
            >
              arrow_back
            </span>
            <span className="font-semibold">{routeEditorDict.backToEditor}</span>
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center px-4 py-2 border border-gold/40 bg-gold/10 text-gold font-sans text-xs uppercase tracking-wider shadow-xs select-none">
            <span className="font-semibold">{routeEditorDict.previewHeader}</span>
          </div>
        </div>
      </div>

      <div className="w-full pb-24">
        <header className="w-full max-w-3xl px-5 md:px-0 pt-20 pb-12 mx-auto text-center">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest block mb-6">
            {typeLabel}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-6 max-w-4xl mx-auto leading-tight">
            {title || previewEditorDict.noTitle}
          </h1>
          {subtitle && (
            <p className="font-serif text-xl md:text-2xl text-charcoal/60 italic max-w-3xl mx-auto mb-6">
              {subtitle}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-4 py-1.5 border border-lines text-charcoal text-[10px] uppercase tracking-[0.2em]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-sm font-semibold text-charcoal/70 mt-10">
            <span className="text-charcoal border-b border-lines pb-1 uppercase tracking-widest">
              {authorName || previewEditorDict.defaultAuthorName}
            </span>
            <span className="font-serif text-lines">—</span>
            <FormattedDate
              date={new Date()}
              lang={activeLang}
              format="long"
              className="uppercase tracking-widest"
            />
          </div>
        </header>

        {coverImageUrl && (
          <div className="w-full max-w-6xl px-5 mx-auto mb-16">
            <NextImage
              className="w-full h-auto"
              alt={previewEditorDict.previewCoverAlt}
              src={coverImageUrl}
              width={1200}
              height={800}
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
          </div>
        )}

        <article className="w-full max-w-2xl px-5 md:px-0 mx-auto min-w-0">
          {showIndex && previewTocItems.length > 0 && (
            <ArticleTableOfContents
              items={previewTocItems}
              label={previewArticleDict.indexLabel}
              ariaLabel={previewArticleDict.indexAriaLabel}
            />
          )}
          <div
            className={`article-content ${isEssay ? 'article-content-essay' : ''}`}
            dangerouslySetInnerHTML={{
              __html: sanitizeArticleHtml(
                renderHeadingAnchors(renderMathInHtml(cleanHtml))
              ),
            }}
          />
        </article>

        <div className="w-full max-w-2xl px-5 md:px-0 mx-auto mt-20 pt-8 border-t border-lines flex items-start gap-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-lines relative shrink-0">
            <NextImage
              className="object-cover"
              alt={previewEditorDict.authorAvatarAlt}
              src={authorAvatarUrl || DEFAULT_AVATAR_URL}
              fill
              sizes="48px"
            />
          </div>
          <div>
            <h3
              className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-2"
              id="preview-author-heading"
            >
              {previewEditorDict.aboutTheAuthor}
            </h3>
            <p className="font-sans text-lg text-charcoal/80">
              <strong>{authorName || previewEditorDict.defaultAuthorName}</strong>{' '}
              {authorBio || previewEditorDict.defaultBio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
