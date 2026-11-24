import Link from 'next/link';
import Image from 'next/image';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  resolveSectionArticle,
  stripHtmlExcerpt,
  type SectionArticleData,
  type SectionArticleDict,
} from './sectionArticleHelpers';

interface PinnedArticlesPanelProps {
  articulos: SectionArticleData[];
  lang: string;
  dict?: SectionArticleDict;
}

export default function PinnedArticlesPanel({ articulos, lang, dict }: PinnedArticlesPanelProps) {
  if (!articulos || articulos.length === 0) return null;

  const fallbackDict = getDictionaryClient(lang);
  const pinnedTitle = dict?.mosaic?.pinnedTitle || dict?.pinnedTitle || fallbackDict.mosaic.pinnedTitle;

  return (
    <section className="border-t border-lines pt-12">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-gold" data-icon="push_pin">push_pin</span>
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal">{pinnedTitle}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {articulos.map((articulo) => {
          const {
            href,
            titulo,
            subtitulo,
            rawContent,
            typeLabel,
            coverUrl,
            coverAlt,
            authorName,
            alternateLocaleBadge,
          } = resolveSectionArticle(articulo, lang, dict, fallbackDict);

          return (
            <Link key={articulo.id} href={href} className="group flex flex-col h-full cursor-pointer">
              <div className="w-full aspect-video relative mb-4 overflow-hidden bg-lines/30">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={coverAlt}
                    fill
                    className="object-cover group-hover:scale-105 transition-all duration-700"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center border border-lines">
                    <span className="font-serif text-4xl text-charcoal/20">§</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">
                  {typeLabel}
                </span>
                {alternateLocaleBadge && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold border border-gold/35 bg-gold/10 px-2 py-0.5">
                    {alternateLocaleBadge}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-3">
                {titulo}
              </h3>
              <p className="font-sans text-sm text-charcoal/60 line-clamp-3">
                {subtitulo || stripHtmlExcerpt(rawContent, 100)}
              </p>
              <div className="mt-auto border-t border-lines pt-3 w-1/3">
                <span className="text-[10px] font-semibold text-charcoal/80 uppercase tracking-widest">
                  {authorName}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
