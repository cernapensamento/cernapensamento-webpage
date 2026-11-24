import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticleCard, { type ArticleCardData } from './ArticleCard';

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

const monolingualEsArticle: ArticleCardData = {
  id: 'mono-es-1',
  slug: 'ensayo-solo-es',
  type: 'essay',
  original_language: 'es',
  title: { es: 'Ensayo solo en español' },
  subtitle: { es: 'Subtítulo en español' },
  cover_image_url: 'https://example.com/cover.webp',
  published_at: '2026-04-01T10:00:00Z',
  author: { full_name: 'Ana Silva' },
  tags: [{ slug: 'economia', name: 'Economía' }],
};

const monolingualGlArticle: ArticleCardData = {
  id: 'mono-gl-1',
  slug: 'ensaio-so-gl',
  type: 'essay',
  original_language: 'gl',
  title: { gl: 'Ensaio só en galego' },
  subtitle: { gl: 'Subtítulo en galego' },
  cover_image_url: null,
  published_at: '2026-04-02T10:00:00Z',
  author: { full_name: 'Lois Paz' },
  tags: [],
};

const bilingualArticle: ArticleCardData = {
  id: 'bi-1',
  slug: 'artigo-bilingue',
  type: 'article',
  original_language: 'gl',
  title: { gl: 'Artigo bilingüe', es: 'Artículo bilingüe' },
  subtitle: { gl: 'Resumo galego', es: 'Resumen español' },
  cover_image_url: 'https://example.com/cover-bi.webp',
  published_at: '2026-04-03T10:00:00Z',
  author: { full_name: 'Brais Castro' },
  tags: [],
};

describe('ArticleCard monolingual visibility and alternate-locale badges', () => {
  it('shows ES title/subtitle and "En castelán" badge for ES monolingual card on /gl', () => {
    render(<ArticleCard articulo={monolingualEsArticle} lang="gl" variant="standard" />);

    expect(screen.getByRole('heading', { name: 'Ensayo solo en español' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo en español')).toBeInTheDocument();
    expect(screen.getByText('En castelán')).toBeInTheDocument();
  });

  it('omits language badge for ES monolingual card on matching /es locale', () => {
    render(<ArticleCard articulo={monolingualEsArticle} lang="es" variant="standard" />);

    expect(screen.getByRole('heading', { name: 'Ensayo solo en español' })).toBeInTheDocument();
    expect(screen.queryByText(/^(En español|En castelán|En gallego|En galego)$/i)).not.toBeInTheDocument();
  });

  it('shows GL title/subtitle and "En gallego" badge for GL monolingual textOnly card on /es', () => {
    render(<ArticleCard articulo={monolingualGlArticle} lang="es" variant="textOnly" />);

    expect(screen.getByRole('heading', { name: 'Ensaio só en galego' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo en galego')).toBeInTheDocument();
    expect(screen.getByText('En gallego')).toBeInTheDocument();
  });

  it('omits language badge for bilingual cards on both /gl and /es', () => {
    const { rerender } = render(
      <ArticleCard articulo={bilingualArticle} lang="gl" variant="standard" />
    );
    expect(screen.queryByText(/^(En español|En castelán|En gallego|En galego)$/i)).not.toBeInTheDocument();

    rerender(<ArticleCard articulo={bilingualArticle} lang="es" variant="standard" />);
    expect(screen.queryByText(/^(En español|En castelán|En gallego|En galego)$/i)).not.toBeInTheDocument();
  });

  it('shows alternate-locale badge across lead, pinned, and compact variants', () => {
    const { rerender } = render(
      <ArticleCard articulo={monolingualEsArticle} lang="gl" variant="lead" />
    );
    expect(screen.getByText('En castelán')).toBeInTheDocument();

    rerender(<ArticleCard articulo={monolingualEsArticle} lang="gl" variant="pinned" />);
    expect(screen.getByText('En castelán')).toBeInTheDocument();

    rerender(<ArticleCard articulo={monolingualEsArticle} lang="gl" variant="compact" />);
    expect(screen.getByText('En castelán')).toBeInTheDocument();
  });
});
