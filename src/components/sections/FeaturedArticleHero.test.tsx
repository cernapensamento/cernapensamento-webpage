import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturedArticleHero from './FeaturedArticleHero';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

describe('FeaturedArticleHero', () => {
  const sampleArticle = {
    id: 'pub-1',
    slug: 'ensaio-liberdade',
    type: 'essay',
    title: {
      gl: 'Ensaio sobre a liberdade',
      es: 'Ensayo sobre la libertad',
      en: 'Essay on Liberty',
    },
    subtitle: {
      gl: 'Reflexións galegas',
      es: 'Reflexiones en castellano',
      en: 'English reflections',
    },
    cover_image_url: 'https://example.com/cover.webp',
    author: {
      full_name: 'Diego Araújo',
    },
  };

  it('uses getDictionaryClient fallback for known locales when dict is omitted', () => {
    render(<FeaturedArticleHero articulo={sampleArticle} lang="es" />);

    expect(screen.getByText('Ensayo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ensayo sobre la libertad' })).toBeInTheDocument();
    expect(screen.getByText('Reflexiones en castellano')).toBeInTheDocument();
    expect(screen.getByText('Por Diego Araújo')).toBeInTheDocument();
  });

  it('uses injected dictionary strings for a new 3rd locale (e.g. "en") without hardcoded strings', () => {
    const enDict = {
      documentTypes: {
        essay: 'Essay',
      },
      articles: {
        by: 'By',
        unknownAuthor: 'Unknown Author',
        featuredCoverAlt: 'Featured article cover image',
      },
    };

    const { rerender } = render(
      <FeaturedArticleHero
        articulo={sampleArticle}
        lang="en"
        dict={enDict}
      />
    );

    expect(screen.getByText('Essay')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Essay on Liberty' })).toBeInTheDocument();
    expect(screen.getByText('English reflections')).toBeInTheDocument();
    expect(screen.getByText('By Diego Araújo')).toBeInTheDocument();
    expect(screen.getByAltText('Essay on Liberty')).toBeInTheDocument();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/en/articulo/ensaio-liberdade');

    const articleWithoutTitleOrAuthor = {
      ...sampleArticle,
      title: { en: '' },
      author: null,
    };

    rerender(
      <FeaturedArticleHero
        articulo={articleWithoutTitleOrAuthor}
        lang="en"
        dict={enDict}
      />
    );

    expect(screen.getByText('By Unknown Author')).toBeInTheDocument();
    expect(screen.getByAltText('Featured article cover image')).toBeInTheDocument();
  });

  it('falls back cleanly to default locale dictionary when a 3rd locale has no dict prop', () => {
    render(<FeaturedArticleHero articulo={{ ...sampleArticle, author: null }} lang="pt" />);

    expect(screen.getByText('Ensaio')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ensaio sobre a liberdade' })).toBeInTheDocument();
    expect(screen.getByText('Por Autor Descoñecido')).toBeInTheDocument();
  });

  it('resolves legacy titulo_gl/titulo_es fields via resolveLocalizedText without lang === "es" hardcoding', () => {
    const legacyArticle = {
      id: 'legacy-1',
      titulo_gl: 'Título legado',
      titulo_es: 'Título legado ES',
      subtitulo_gl: 'Subtítulo legado',
      subtitulo_es: 'Subtítulo legado ES',
    };

    render(<FeaturedArticleHero articulo={legacyArticle} lang="es" />);

    expect(screen.getByRole('heading', { name: 'Título legado ES' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo legado ES')).toBeInTheDocument();
  });

  it('shows alternate-locale badge only when hero publication is monolingual in another locale', () => {
    const monoEsHero = {
      id: 'hero-es-1',
      slug: 'heroe-es',
      type: 'essay',
      original_language: 'es',
      title: { es: 'Ensayo destacado en español' },
      subtitle: { es: 'Subtítulo destacado en español' },
      author: { full_name: 'Diego Araújo' },
    };

    const { rerender } = render(<FeaturedArticleHero articulo={monoEsHero} lang="gl" />);
    expect(screen.getByRole('heading', { name: 'Ensayo destacado en español' })).toBeInTheDocument();
    expect(screen.getByText('En castelán')).toBeInTheDocument();

    rerender(<FeaturedArticleHero articulo={monoEsHero} lang="es" />);
    expect(screen.queryByText(/^(En español|En castelán|En gallego|En galego)$/i)).not.toBeInTheDocument();
  });
});
