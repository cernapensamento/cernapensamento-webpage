import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstatutosCard } from './EstatutosCard';
import { getDictionaryClient } from '@/dictionaries/client';

vi.mock('@/components/ui/RevealOnScroll', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EstatutosCard component', () => {
  it('uses getDictionaryClient fallback when legalFramework is omitted', () => {
    const esLegal = getDictionaryClient('es').asociacion.legalFramework;

    render(
      <EstatutosCard
        lang="es"
        title="Estatutos"
        description="Documento oficial"
        readMoreText="Leer estatutos"
      />
    );

    expect(screen.getByText(esLegal)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /leer estatutos/i })).toHaveAttribute(
      'href',
      '/es/asociacion/estatutos'
    );
  });

  it('uses injected legalFramework for a 3rd locale without hardcoded strings', () => {
    render(
      <EstatutosCard
        lang="en"
        title="Bylaws"
        description="Official association charter"
        readMoreText="Read Bylaws"
        legalFramework="Legal Framework & Ideology"
      />
    );

    expect(screen.getByText('Legal Framework & Ideology')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read bylaws/i })).toHaveAttribute(
      'href',
      '/en/asociacion/estatutos'
    );
  });
});
