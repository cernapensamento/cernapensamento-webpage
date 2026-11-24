import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EscritorioPublicationRow from './EscritorioPublicationRow';
import { getDictionaryClient } from '@/dictionaries/client';
import type { PublicationDashboardItem } from '@/lib/db/types';

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

vi.mock('./PinArticleButton', () => ({
  default: () => <button type="button">Pin</button>,
}));

vi.mock('./DeleteArticleButton', () => ({
  default: () => <button type="button">Delete</button>,
}));

const basePub: PublicationDashboardItem = {
  id: 'pub-1',
  slug: 'mi-publicacion',
  title: { gl: 'Título en galego', es: 'Título en español' },
  subtitle: { gl: 'Subtítulo en galego', es: 'Subtítulo en español' },
  cover_image_url: null,
  type: 'essay',
  status: 'published',
  original_language: 'gl',
  is_pinned: false,
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
  published_at: '2026-04-01T10:00:00Z',
  author_id: 'author-1',
  author: { id: 'author-1', full_name: 'Ana Silva' },
};

describe('EscritorioPublicationRow', () => {
  it('renders GL · ES badge for bilingual publications', () => {
    const dict = getDictionaryClient('gl');
    render(
      <EscritorioPublicationRow
        pub={basePub}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByText('GL · ES')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Título en galego' })).toBeInTheDocument();
  });

  it('renders ES badge and resolves ES title via original_language for ES monolingual publication on /gl', () => {
    const dict = getDictionaryClient('gl');
    const monoEs: PublicationDashboardItem = {
      ...basePub,
      id: 'pub-es',
      original_language: 'es',
      title: { es: 'Ensayo solo en español' },
      subtitle: { es: 'Subtítulo en español' },
    };

    render(
      <EscritorioPublicationRow
        pub={monoEs}
        lang="gl"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByText('ES')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ensayo solo en español' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo en español')).toBeInTheDocument();
  });

  it('renders GL badge for GL monolingual publication on /es', () => {
    const dict = getDictionaryClient('es');
    const monoGl: PublicationDashboardItem = {
      ...basePub,
      id: 'pub-gl',
      original_language: 'gl',
      title: { gl: 'Ensaio só en galego' },
      subtitle: null,
    };

    render(
      <EscritorioPublicationRow
        pub={monoGl}
        lang="es"
        dict={dict}
        forApproval={false}
        canReview={true}
      />
    );

    expect(screen.getByText('GL')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ensaio só en galego' })).toBeInTheDocument();
  });

  it('renders localized untitled draft fallback and language badge when a draft has no stored title', () => {
    const glDict = getDictionaryClient('gl');
    const esDict = getDictionaryClient('es');
    const untitledDraft: PublicationDashboardItem = {
      ...basePub,
      id: 'draft-empty',
      status: 'draft',
      original_language: 'es',
      title: {},
      subtitle: null,
    };

    const { rerender } = render(
      <EscritorioPublicationRow
        pub={untitledDraft}
        lang="gl"
        dict={glDict}
        forApproval={false}
        canReview={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Borrador sen título' })).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();

    rerender(
      <EscritorioPublicationRow
        pub={untitledDraft}
        lang="es"
        dict={esDict}
        forApproval={false}
        canReview={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Borrador sin título' })).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
  });
});
