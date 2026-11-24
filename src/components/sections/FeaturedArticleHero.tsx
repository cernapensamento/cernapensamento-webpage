import Link from 'next/link';
import Image from 'next/image';
import {
  resolveSectionArticle,
  stripHtmlExcerpt,
  type SectionArticleData,
  type SectionArticleDict,
} from './sectionArticleHelpers';

export type FeaturedArticleHeroDict = SectionArticleDict;

interface FeaturedArticleHeroProps {
  articulo: SectionArticleData;
  lang: string;
  dict?: FeaturedArticleHeroDict;
}

export default function FeaturedArticleHero({ articulo, lang, dict }: FeaturedArticleHeroProps) {
  if (!articulo) return null;

  const {
    href,
    titulo,
    subtitulo,
    rawContent,
    typeLabel,
    coverUrl,
    coverAlt,
    authorName,
    byLabel,
    alternateLocaleBadge,
  } = resolveSectionArticle(articulo, lang, dict);

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
      <Link href={href} className="md:col-span-7 h-[400px] md:h-[600px] relative w-full overflow-hidden bg-lines block">
        {coverUrl ? (
          <Image
            alt={coverAlt}
            className="object-cover transition-all duration-700 ease-in-out"
            src={coverUrl}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl text-charcoal/20 font-serif">§</span>
          </div>
        )}
      </Link>
      <div className="md:col-span-5 flex flex-col gap-6 pt-6 md:pt-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">
            {typeLabel}
          </span>
          {alternateLocaleBadge && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold border border-gold/35 bg-gold/10 px-2 py-0.5">
              {alternateLocaleBadge}
            </span>
          )}
        </div>
        <Link href={href}>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal cursor-pointer hover:text-gold transition-colors duration-300 leading-tight">
            {titulo}
          </h1>
        </Link>
        <p className="font-sans text-lg text-charcoal/80 line-clamp-4">
          {subtitulo || stripHtmlExcerpt(rawContent, 150)}
        </p>
        <div className="pt-4 border-t border-lines w-1/4 mt-2">
          <span className="text-sm font-semibold text-charcoal uppercase tracking-widest">
            {byLabel} {authorName}
          </span>
        </div>
      </div>
    </section>
  );
}
