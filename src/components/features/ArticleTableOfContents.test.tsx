import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArticleTableOfContents from './ArticleTableOfContents';

describe('ArticleTableOfContents', () => {
  it('returns null when items array is empty', () => {
    const { container } = render(
      <ArticleTableOfContents items={[]} label="Índice" ariaLabel="Índice do artigo" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders hierarchical numbering and anchor links matching slugs', () => {
    render(
      <ArticleTableOfContents
        items={[
          { path: [1], text: 'Introdución', slug: 'introducion' as never },
          { path: [1, 1], text: 'Contexto histórico', slug: 'contexto-historico' as never },
          { path: [1, 1, 1], text: 'Fontes primarias', slug: 'fontes-primarias' as never },
        ]}
        label="Índice"
        ariaLabel="Índice do artigo"
      />
    );

    const nav = screen.getByRole('navigation', { name: 'Índice do artigo' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Índice')).toBeInTheDocument();
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('1.1.')).toBeInTheDocument();
    expect(screen.getByText('1.1.1.')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Introdución' })).toHaveAttribute('href', '#introducion');
    expect(screen.getByRole('link', { name: 'Contexto histórico' })).toHaveAttribute('href', '#contexto-historico');
    expect(screen.getByRole('link', { name: 'Fontes primarias' })).toHaveAttribute('href', '#fontes-primarias');
  });

  it('invokes onItemClick handler when an item link is clicked', () => {
    const handleClick = vi.fn<(e: React.MouseEvent, item: unknown) => void>((e) => e.preventDefault());
    const item = { id: 'sec-1', path: [1], text: 'Sección Un', slug: 'seccion-un' as never };

    render(
      <ArticleTableOfContents
        items={[item]}
        label="Índice"
        ariaLabel="Índice do artigo"
        onItemClick={handleClick}
      />
    );

    fireEvent.click(screen.getByRole('link', { name: 'Sección Un' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(expect.anything(), item);
  });
});
