import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as contentModule from '@/lib/content';
import { SITE_NAME } from '@/lib/constants';
import {
  createCollectionMetadata,
  EditorialCollectionPage,
} from './EditorialCollectionPage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EditorialCollectionPage', () => {
  it.each([
    ['Correo de correo: anxoperez@cernapensamento.org', 'anxoperez@cernapensamento.org'],
    ['Email: editor@cernapensamento.org', 'editor@cernapensamento.org'],
    ['Courriel : contact@cernapensamento.org', 'contact@cernapensamento.org'],
    ['plain@cernapensamento.org', 'plain@cernapensamento.org'],
    ['  fallback-no-at  ', 'fallback-no-at'],
  ])('extracts language-agnostic mailto target from "%s"', (correo, expectedEmail) => {
    vi.spyOn(contentModule, 'getDocument').mockReturnValue({
      data: {
        title: 'Collection Title',
        responsable: 'Responsible Editor',
        correo,
      },
      content: '### Guideline\n\nBody text.',
    });

    render(<EditorialCollectionPage slug="coleccion-ensayos" lang="en" />);

    const link = screen.getByRole('link', { name: correo.trim() });
    expect(link).toHaveAttribute('href', `mailto:${expectedEmail}`);
    expect(screen.getByRole('heading', { name: 'Collection Title' })).toBeInTheDocument();
  });

  it('generates localized metadata from collection frontmatter', async () => {
    vi.spyOn(contentModule, 'getDocument').mockReturnValue({
      data: {
        title: 'Colección Ensayos',
        responsable: 'Responsable: Diego',
      },
      content: '',
    });

    const meta = await createCollectionMetadata('coleccion-ensayos', 'es');
    expect(meta).toEqual({
      title: `Colección Ensayos | ${SITE_NAME}`,
      description: 'Responsable: Diego',
    });
  });

  it('falls back to SITE_NAME when collection title is missing', async () => {
    vi.spyOn(contentModule, 'getDocument').mockReturnValue({
      data: {},
      content: '',
    });

    const meta = await createCollectionMetadata('coleccion-articulos', 'gl');
    expect(meta).toEqual({ title: SITE_NAME });
  });
});
