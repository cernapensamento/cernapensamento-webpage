'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Columnist } from '@/lib/columnists';

export interface ArticleData {
  id: string | number;
  slug?: string;
  tipo?: string;
  titulo_es?: string;
  titulo_gl?: string;
  subtitulo_es?: string;
  subtitulo_gl?: string;
  contenido_es?: string;
  contenido_gl?: string;
  imagen_url?: string | null;
  tematicas?: string[] | null;
  creado_en?: string;
  actualizado_en?: string;
  publicado_en?: string | null;
  fijado?: boolean;
}

export interface TopicInfo {
  slug: string;
  name: string;
  count: number;
}

interface AuthorProfileViewProps {
  autor: {
    id: string;
    nombre: string;
    bio?: string | null;
    avatar_url?: string | null;
    rol?: string | null;
    slug?: string | null;
  };
  columnist?: Columnist;
  avatarSrc: string;
  bio: string;
  roleLabel: string;
  worksCountLabel: string;
  availableTopics: TopicInfo[];
  articulos: ArticleData[];
  lang: string;
  dict: {
    nav?: {
      inicio?: string;
      autores?: string;
      [key: string]: unknown;
    };
    authorPage?: {
      allWorks?: string;
      noArticles?: string;
      readingTime?: string;
      topics?: string;
      contact?: string;
      aboutAuthor?: string;
      latestWork?: string;
      archive?: string;
      foundingMember?: string;
      cernaContributor?: string;
      editorialBoard?: string;
      allTopics?: string;
      clearFilter?: string;
      readFullText?: string;
      publishedWorks?: string;
      publishedWorkSingular?: string;
      home?: string;
      authors?: string;
      defaultBio?: string;
      email?: string;
      sendEmailTo?: string;
      instagramProfileOf?: string;
      portraitOf?: string;
      filterByTopic?: string;
      publicationSingular?: string;
      publicationPlural?: string;
      textSingular?: string;
      textPlural?: string;
      [key: string]: unknown;
    };
    documentTypes?: Record<string, string>;
    articles?: {
      tag?: string;
    };
    [key: string]: unknown;
  };
}

function calculateReadingTime(text?: string | null): number {
  if (!text) return 4;
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const GL_MONTHS = [
  'xaneiro', 'febreiro', 'marzo', 'abril', 'maio', 'xuño',
  'xullo', 'agosto', 'setembro', 'outubro', 'novembro', 'decembro'
];

function formatDate(dateStr?: string | null, lang: string = 'gl'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    if (lang === 'gl') {
      return `${d.getDate()} de ${GL_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
    }
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

export default function AuthorProfileView({
  autor,
  columnist,
  avatarSrc,
  bio,
  roleLabel,
  worksCountLabel,
  availableTopics,
  articulos,
  lang,
  dict,
}: AuthorProfileViewProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Map of topic slug -> human-readable translated name
  const topicNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of availableTopics) {
      map.set(t.slug, t.name);
    }
    return map;
  }, [availableTopics]);

  const getTopicDisplayName = (slug: string) => {
    return topicNameMap.get(slug) || slug;
  };

  // Types summary (all / artigo / ensaio...)
  const typesSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const art of articulos) {
      const t = art.tipo?.toLowerCase() || 'artigo';
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [articulos]);

  const uniqueTypes = useMemo(() => Object.keys(typesSummary), [typesSummary]);

  // Filter articles by type AND selected topic
  const filteredArticles = useMemo(() => {
    return articulos.filter(a => {
      const matchesType = selectedType === 'all' || (a.tipo?.toLowerCase() || 'artigo') === selectedType;
      const matchesTopic = !selectedTopic || (Array.isArray(a.tematicas) && a.tematicas.includes(selectedTopic));
      return matchesType && matchesTopic;
    });
  }, [articulos, selectedType, selectedTopic]);

  const hasMultipleTypes = uniqueTypes.length > 1;
  const isDefaultView = selectedType === 'all' && !selectedTopic;
  const showFeaturedSpotlight = isDefaultView && filteredArticles.length >= 2;
  const featuredArticle = showFeaturedSpotlight ? filteredArticles[0] : null;
  const gridArticles = showFeaturedSpotlight ? filteredArticles.slice(1) : filteredArticles;

  // Dictionary strings
  const tAll = dict.authorPage?.allWorks || 'Todos';
  const tReadingTime = dict.authorPage?.readingTime || 'min de lectura';
  const tReadFull = dict.authorPage?.readFullText || 'Ler texto completo';
  const tLatest = dict.authorPage?.latestWork || 'Última publicación';
  const tArchive = dict.authorPage?.archive || 'Arquivo de publicacións';
  const tNoArticles = dict.authorPage?.noArticles || 'Non hai artigos publicados por este autor.';
  const tClearFilter = dict.authorPage?.clearFilter || 'Limpar filtro';
  const tHome = dict.nav?.inicio || dict.authorPage?.home || 'Inicio';
  const tAuthors = dict.nav?.autores || dict.authorPage?.authors || 'Autores';
  const tDefaultBio = dict.authorPage?.defaultBio || 'Autor e colaborador en Cerna.';
  const tEmail = dict.authorPage?.email || 'Correo';
  const tSendEmailTo = dict.authorPage?.sendEmailTo || 'Enviar correo a';
  const tInstagramProfileOf = dict.authorPage?.instagramProfileOf || 'Perfil de Instagram de';
  const tPortraitOf = dict.authorPage?.portraitOf || 'Retrato de';
  const tFilterBy = dict.authorPage?.filterByTopic || 'Filtrar por';
  const tPubSingular = dict.authorPage?.publicationSingular || 'publicación';
  const tPubPlural = dict.authorPage?.publicationPlural || 'publicacións';
  const tTextSingular = dict.authorPage?.textSingular || 'texto';
  const tTextPlural = dict.authorPage?.textPlural || 'textos';

  const getTypeLabel = (rawType?: string) => {
    if (!rawType) return dict.documentTypes?.artigo || 'Artigo';
    const key = rawType.toLowerCase();
    return dict.documentTypes?.[key] || rawType.charAt(0).toUpperCase() + rawType.slice(1);
  };

  const handleTopicClick = (topicSlug: string) => {
    if (selectedTopic === topicSlug) {
      setSelectedTopic(null);
    } else {
      setSelectedTopic(topicSlug);
      // Smooth scroll to publications if clicking from masthead
      const pubSection = document.getElementById('publicacions-autor');
      if (pubSection) {
        pubSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="flex-grow bg-parchment flex flex-col selection:bg-gold/20 selection:text-charcoal min-h-screen">
      <main className="flex-grow pt-8 sm:pt-10 md:pt-12 pb-20">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 md:px-12">
          
          {/* Top Editorial Breadcrumbs */}
          <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs font-sans text-charcoal/50 mb-8">
            <Link href={`/${lang}`} className="hover:text-gold transition-colors">
              {tHome}
            </Link>
            <span className="text-charcoal/30 text-[10px]">/</span>
            <Link href={`/${lang}#autores`} className="hover:text-gold transition-colors">
              {tAuthors}
            </Link>
            <span className="text-charcoal/30 text-[10px]">/</span>
            <span className="text-charcoal/80 font-medium truncate">
              {autor.nombre}
            </span>
          </nav>

          {/* Asymmetric Author Dossier / Masthead */}
          <header className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-start pb-12 mb-12 border-b border-lines">
            
            {/* Left Column: Portrait and Verified Channels */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-[290px] lg:h-[290px] rounded-full p-2.5 border border-lines bg-surface/40 shadow-sm ring-1 ring-gold/20 transition-all duration-500 hover:border-gold/40 hover:ring-gold/35 hover:shadow-md group">
                <div className="relative w-full h-full rounded-full overflow-hidden border border-lines/80 bg-lines/20">
                  <Image
                    src={avatarSrc}
                    alt={`${tPortraitOf} ${autor.nombre}`}
                    fill
                    sizes="(max-width: 768px) 256px, (max-width: 1200px) 288px, 320px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    priority
                  />
                </div>
              </div>

              {/* Social / Contact Pills */}
              {columnist && (
                <div className="flex flex-wrap gap-2.5 mt-6 justify-center w-full">
                  {columnist.email && (
                    <a
                      href={`mailto:${columnist.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lines bg-surface/60 hover:bg-surface text-charcoal/70 hover:text-charcoal hover:border-gold/40 text-xs font-sans transition-all"
                      aria-label={`${tSendEmailTo} ${autor.nombre}`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-gold" aria-hidden="true">mail</span>
                      <span className="uppercase tracking-wider text-[11px] font-medium">{tEmail}</span>
                    </a>
                  )}
                  {columnist.instagram && (
                    <a
                      href={`https://instagram.com/${columnist.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lines bg-surface/60 hover:bg-surface text-charcoal/70 hover:text-charcoal hover:border-gold/40 text-xs font-sans transition-all"
                      aria-label={`${tInstagramProfileOf} ${autor.nombre}`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-gold" aria-hidden="true">photo_camera</span>
                      <span className="uppercase tracking-wider text-[11px] font-medium">Instagram</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Literary Dossier and Trajectory */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col">
              
              {/* Eyebrow & Stats Strip */}
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest mb-3">
                <span className="font-semibold text-gold px-2.5 py-0.5 rounded bg-gold/10">
                  {roleLabel}
                </span>
                <span className="text-charcoal/30">•</span>
                <span className="font-sans text-charcoal/60 font-medium">
                  {worksCountLabel}
                </span>
              </div>

              {/* Author Headline */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal tracking-tight leading-[1.08] mb-6">
                {autor.nombre}
              </h1>

              {/* Literary Bio */}
              {bio ? (
                <p className="font-sans text-base sm:text-lg text-charcoal/80 leading-relaxed max-w-2xl mb-8">
                  {bio}
                </p>
              ) : (
                <p className="font-sans text-base text-charcoal/50 italic mb-8">
                  {tDefaultBio}
                </p>
              )}

              {/* Habitual Themes Pill Row (Interactive & Responsive with published articles) */}
              {availableTopics.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-lines/60">
                  <span className="text-xs uppercase tracking-wider text-charcoal/50 font-medium mr-1 select-none">
                    {dict.authorPage?.topics || 'Temáticas habituais'}:
                  </span>
                  {availableTopics.map(topic => {
                    const isSelected = selectedTopic === topic.slug;
                    return (
                      <button
                        key={topic.slug}
                        type="button"
                        onClick={() => handleTopicClick(topic.slug)}
                        className={`text-xs font-sans px-2.5 py-1 rounded transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gold text-parchment font-medium shadow-sm'
                            : 'bg-lines/30 text-charcoal/80 hover:bg-gold/15 hover:text-charcoal border border-transparent hover:border-gold/30'
                        }`}
                        title={`${tFilterBy} ${topic.name}`}
                      >
                        <span>#{topic.name}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-parchment/80' : 'text-charcoal/50'}`}>
                          ({topic.count})
                        </span>
                      </button>
                    );
                  })}
                  {selectedTopic && (
                    <button
                      type="button"
                      onClick={() => setSelectedTopic(null)}
                      className="text-xs text-charcoal/60 hover:text-charcoal underline underline-offset-4 ml-2 transition-colors cursor-pointer"
                    >
                      {tClearFilter}
                    </button>
                  )}
                </div>
              )}

            </div>
          </header>

          {/* Exhibition of Published Works */}
          <div id="publicacions-autor" className="flex flex-col gap-12 scroll-mt-28">
            
            {/* Filter Navigation Bar (No scrollbars, fully responsive) */}
            {(hasMultipleTypes || selectedTopic) && (
              <div className="border-b border-lines">
                <div className="flex flex-wrap items-center justify-between gap-4 -mb-px">
                  <nav className="flex flex-wrap items-center gap-4 sm:gap-8" aria-label="Filtro por tipo de publicación">
                    <button
                      type="button"
                      onClick={() => setSelectedType('all')}
                      className={`pb-3 text-xs sm:text-sm font-sans uppercase tracking-widest transition-all duration-200 border-b-2 cursor-pointer ${
                        selectedType === 'all'
                          ? 'border-gold text-charcoal font-semibold'
                          : 'border-transparent text-charcoal/60 hover:text-charcoal'
                      }`}
                    >
                      {tAll} <span className="opacity-60 text-xs">({articulos.length})</span>
                    </button>
                    {uniqueTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedType(type)}
                        className={`pb-3 text-xs sm:text-sm font-sans uppercase tracking-widest transition-all duration-200 border-b-2 cursor-pointer ${
                          selectedType === type
                            ? 'border-gold text-charcoal font-semibold'
                            : 'border-transparent text-charcoal/60 hover:text-charcoal'
                        }`}
                      >
                        {getTypeLabel(type)} <span className="opacity-60 text-xs">({typesSummary[type]})</span>
                      </button>
                    ))}
                  </nav>

                  {/* Active Filter Indicators / Counter */}
                  <div className="flex items-center gap-3 pb-3">
                    {selectedTopic && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gold/15 text-charcoal border border-gold/40 text-xs">
                        <span className="font-medium">#{getTopicDisplayName(selectedTopic)}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTopic(null)}
                          className="hover:text-gold ml-1 font-bold cursor-pointer"
                          aria-label={tClearFilter}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <span className="text-xs uppercase tracking-widest text-charcoal/40 font-mono">
                      {filteredArticles.length} {filteredArticles.length === 1 ? tPubSingular : tPubPlural}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Zero State if Filter Yields No Matches */}
            {filteredArticles.length === 0 && (
              <div className="py-20 border-t border-lines text-center max-w-xl mx-auto">
                <span className="text-4xl text-charcoal/20 font-serif block mb-4">§</span>
                <p className="font-serif text-2xl text-charcoal/70 mb-3">{tNoArticles}</p>
                {selectedTopic && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopic(null);
                      setSelectedType('all');
                    }}
                    className="inline-block mt-2 px-4 py-2 border border-charcoal/30 text-xs uppercase tracking-widest text-charcoal/80 hover:bg-charcoal hover:text-parchment transition-all cursor-pointer rounded"
                  >
                    {tClearFilter}
                  </button>
                )}
              </div>
            )}

            {/* Featured Lead Spotlight */}
            {featuredArticle && (
              <section aria-labelledby="featured-work-heading" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <span id="featured-work-heading" className="text-xs font-semibold text-gold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold inline-block animate-pulse"></span>
                    {tLatest}
                  </span>
                </div>

                {(() => {
                  const titulo = lang === 'es' ? featuredArticle.titulo_es : featuredArticle.titulo_gl;
                  const subtitulo = lang === 'es' ? featuredArticle.subtitulo_es : featuredArticle.subtitulo_gl;
                  const contenido = lang === 'es' ? featuredArticle.contenido_es : featuredArticle.contenido_gl;
                  const dateStr = featuredArticle.actualizado_en || featuredArticle.creado_en;
                  const readingMins = calculateReadingTime(contenido);

                  return (
                    <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-surface/40 border border-lines p-6 md:p-10 rounded-2xl group transition-all duration-500 hover:border-gold/50 hover:shadow-md">
                      <Link
                        href={`/${lang}/articulo/${featuredArticle.slug || featuredArticle.id}`}
                        className="lg:col-span-6 relative w-full h-[260px] sm:h-[340px] rounded-xl overflow-hidden bg-lines/40 block shrink-0"
                        aria-label={titulo}
                      >
                        {featuredArticle.imagen_url ? (
                          <Image
                            src={featuredArticle.imagen_url}
                            alt={titulo || 'Portada do artigo destacado'}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            priority
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-lines/20 to-surface">
                            <span className="text-7xl text-charcoal/15 font-serif select-none">§</span>
                          </div>
                        )}
                      </Link>

                      <div className="lg:col-span-6 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-2.5 py-1 text-[11px] font-semibold text-gold bg-gold/10 rounded uppercase tracking-widest">
                              {getTypeLabel(featuredArticle.tipo)}
                            </span>
                            {dateStr && (
                              <time dateTime={dateStr} className="text-xs text-charcoal/60 font-sans">
                                {formatDate(dateStr, lang)}
                              </time>
                            )}
                            <span className="text-xs text-charcoal/40">•</span>
                            <span className="text-xs text-charcoal/60 font-sans">
                              {readingMins} {tReadingTime}
                            </span>
                          </div>

                          <Link href={`/${lang}/articulo/${featuredArticle.slug || featuredArticle.id}`}>
                            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal group-hover:text-gold transition-colors duration-300 leading-tight mb-4">
                              {titulo}
                            </h2>
                          </Link>

                          <p className="font-sans text-base sm:text-lg text-charcoal/80 line-clamp-3 md:line-clamp-4 leading-relaxed mb-6">
                            {subtitulo || (contenido ? contenido.replace(/<[^>]*>/g, '').substring(0, 180) + '...' : '')}
                          </p>
                        </div>

                        <div className="pt-6 border-t border-lines/60 flex flex-wrap items-center justify-between gap-4">
                          {featuredArticle.tematicas && featuredArticle.tematicas.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {featuredArticle.tematicas.slice(0, 3).map((tag, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleTopicClick(tag)}
                                  className="text-[11px] uppercase tracking-wider text-charcoal/70 bg-lines/30 hover:bg-gold/15 hover:text-charcoal px-2 py-0.5 rounded transition-colors cursor-pointer"
                                >
                                  #{getTopicDisplayName(tag)}
                                </button>
                              ))}
                            </div>
                          )}
                          <Link
                            href={`/${lang}/articulo/${featuredArticle.slug || featuredArticle.id}`}
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-charcoal group-hover:text-gold transition-colors ml-auto"
                          >
                            <span>{tReadFull}</span>
                            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })()}
              </section>
            )}

            {/* Archive Grid */}
            {gridArticles.length > 0 && (
              <section aria-label={tArchive} className="w-full">
                {showFeaturedSpotlight && (
                  <div className="flex items-center gap-4 mb-8">
                    <h3 className="font-serif text-2xl text-charcoal">{tArchive}</h3>
                    <div className="flex-grow h-[1px] bg-lines"></div>
                    <span className="text-xs uppercase tracking-widest text-charcoal/40 font-mono">
                      {gridArticles.length} {gridArticles.length === 1 ? tTextSingular : tTextPlural}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {gridArticles.map(articulo => {
                    const titulo = lang === 'es' ? articulo.titulo_es : articulo.titulo_gl;
                    const subtitulo = lang === 'es' ? articulo.subtitulo_es : articulo.subtitulo_gl;
                    const contenido = lang === 'es' ? articulo.contenido_es : articulo.contenido_gl;
                    const dateStr = articulo.actualizado_en || articulo.creado_en;
                    const readingMins = calculateReadingTime(contenido);

                    return (
                      <article
                        key={articulo.id}
                        className="group flex flex-col bg-surface/30 hover:bg-surface/70 border border-lines hover:border-gold/50 rounded-xl p-6 transition-all duration-300 hover:shadow-sm h-full"
                      >
                        {/* Optional thumbnail preview */}
                        {articulo.imagen_url && (
                          <Link
                            href={`/${lang}/articulo/${articulo.slug || articulo.id}`}
                            className="relative w-full h-44 rounded-lg overflow-hidden bg-lines/30 mb-5 block"
                            aria-label={titulo}
                            tabIndex={-1}
                          >
                            <Image
                              src={articulo.imagen_url}
                              alt={titulo || 'Miniatura do artigo'}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </Link>
                        )}

                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-semibold text-gold uppercase tracking-widest">
                            {getTypeLabel(articulo.tipo)}
                          </span>
                          <span className="text-[11px] text-charcoal/50 font-sans">
                            {readingMins} {tReadingTime}
                          </span>
                        </div>

                        <Link href={`/${lang}/articulo/${articulo.slug || articulo.id}`}>
                          <h4 className="font-serif text-xl sm:text-2xl text-charcoal group-hover:text-gold transition-colors duration-300 leading-snug mb-3 line-clamp-3">
                            {titulo}
                          </h4>
                        </Link>

                        <p className="font-sans text-sm sm:text-base text-charcoal/70 line-clamp-3 leading-relaxed mb-4">
                          {subtitulo || (contenido ? contenido.replace(/<[^>]*>/g, '').substring(0, 140) + '...' : '')}
                        </p>

                        {/* Labels / Temáticas: beneath subtitle, above publication date */}
                        {articulo.tematicas && articulo.tematicas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {articulo.tematicas.map((tag, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleTopicClick(tag)}
                                className="text-[11px] font-sans uppercase tracking-wider text-charcoal/70 bg-lines/30 hover:bg-gold/15 hover:text-charcoal px-2 py-0.5 rounded transition-colors cursor-pointer"
                              >
                                #{getTopicDisplayName(tag)}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Time of publication in card footer */}
                        <div className="mt-auto pt-4 border-t border-lines/60 flex items-center justify-between text-xs text-charcoal/60">
                          {dateStr && (
                            <time dateTime={dateStr} className="font-sans">
                              {formatDate(dateStr, lang)}
                            </time>
                          )}
                          <Link
                            href={`/${lang}/articulo/${articulo.slug || articulo.id}`}
                            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-charcoal/60 group-hover:text-gold transition-colors font-medium ml-auto"
                          >
                            <span>{tReadFull}</span>
                            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
