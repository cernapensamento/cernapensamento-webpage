import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticuloPage, { generateMetadata } from './page';
import { SITE_URL } from '@/lib/constants';
import type { PublicationDetail } from '@/lib/db/types';

const mockGetPublicationBySlug = vi.fn();

vi.mock('@/lib/db/queries/publications', () => ({
  getPublicationBySlug: (...args: unknown[]) => mockGetPublicationBySlug(...args),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, src } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={String(alt ?? '')} src={String(src ?? '')} />;
  },
}));

vi.mock('@/components/features/CommentsSection', () => ({
  default: () => <div data-testid="comments-section" />,
}));

vi.mock('@/components/features/ArticleDownload', () => ({
  default: () => <div data-testid="article-download" />,
}));

vi.mock('@/components/features/ArticleScrollManager', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/features/ArticleTableOfContents', () => ({
  default: () => <nav data-testid="article-toc" />,
}));

vi.mock('@/components/escritorio/ReviewActionBar', () => ({
  default: () => <div data-testid="review-action-bar" />,
}));

function makePublication(overrides: Partial<PublicationDetail> = {}): PublicationDetail {
  return {
    id: 'pub-1',
    slug: 'ensaio-liberdade',
    title: { gl: 'Ensaio sobre a liberdade' },
    subtitle: { gl: 'Unha reflexión galega' },
    content: { gl: '<p>Contido en galego sobre a liberdade.</p>' },
    cover_image_url: null,
    status: 'published',
    type: 'essay',
    original_language: 'gl',
    is_pinned: false,
    show_index: false,
    published_at: '2026-01-15T10:00:00Z',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    author: {
      id: 'author-1',
      full_name: 'Rosalía de Castro',
      slug: 'rosalia',
      bio: { gl: 'Escritora', es: 'Escritora' },
      avatar_url: null,
    },
    tags: [],
    ...overrides,
  };
}

describe('ArticuloPage & generateMetadata — monolingual and bilingual display states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a monolingual GL publication on the ES alternate locale with fallback content, availability notice, body lang="gl", no "Original in" link, and canonical pointing to /gl/', async () => {
    const pub = makePublication({
      slug: 'ensaio-galego',
      title: { gl: 'Ensaio en galego' },
      subtitle: { gl: 'Subtítulo en galego' },
      content: { gl: '<p>Texto dispoñible unicamente en galego.</p>' },
      original_language: 'gl',
    });
    mockGetPublicationBySlug.mockResolvedValue(pub);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: 'es', slug: 'ensaio-galego' }),
    });
    expect(metadata.title).toBe('Ensaio en galego');
    expect(metadata.description).toBe('Subtítulo en galego');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/gl/articulo/ensaio-galego`);

    const ui = await ArticuloPage({
      params: Promise.resolve({ lang: 'es', slug: 'ensaio-galego' }),
    });
    const { container } = render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Ensaio en galego' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo en galego')).toBeInTheDocument();
    expect(screen.getByText('Texto dispoñible unicamente en galego.')).toBeInTheDocument();

    // Localized availability notice in ES UI
    expect(screen.getByText('Este texto solo está disponible en gallego.')).toBeInTheDocument();

    // Must NOT show the misleading "Idioma original:" translation link
    expect(screen.queryByText(/Idioma original:/i)).not.toBeInTheDocument();

    // Body container carries lang="gl"
    const articleBody = container.querySelector('.article-content');
    expect(articleBody).toHaveAttribute('lang', 'gl');
  });

  it('renders a monolingual ES publication on the GL alternate locale with ES fallback, GL availability notice, body lang="es", and canonical pointing to /es/', async () => {
    const pub = makePublication({
      slug: 'ensayo-espanol',
      title: { es: 'Ensayo en español' },
      subtitle: { es: 'Subtítulo en español' },
      content: { es: '<p>Texto disponible únicamente en español.</p>' },
      original_language: 'es',
    });
    mockGetPublicationBySlug.mockResolvedValue(pub);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: 'gl', slug: 'ensayo-espanol' }),
    });
    expect(metadata.title).toBe('Ensayo en español');
    expect(metadata.description).toBe('Subtítulo en español');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/es/articulo/ensayo-espanol`);

    const ui = await ArticuloPage({
      params: Promise.resolve({ lang: 'gl', slug: 'ensayo-espanol' }),
    });
    const { container } = render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Ensayo en español' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo en español')).toBeInTheDocument();
    expect(screen.getByText('Texto disponible únicamente en español.')).toBeInTheDocument();
    expect(screen.getByText('Este texto só está dispoñible en castelán.')).toBeInTheDocument();
    expect(screen.queryByText(/Idioma orixinal:/i)).not.toBeInTheDocument();

    const articleBody = container.querySelector('.article-content');
    expect(articleBody).toHaveAttribute('lang', 'es');
  });

  it('renders a monolingual publication on its matching locale URL cleanly with no availability notice and no "Original in" link', async () => {
    const pub = makePublication({
      slug: 'ensaio-galego',
      title: { gl: 'Ensaio en galego' },
      subtitle: { gl: 'Subtítulo en galego' },
      content: { gl: '<p>Contido en galego.</p>' },
      original_language: 'gl',
    });
    mockGetPublicationBySlug.mockResolvedValue(pub);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: 'gl', slug: 'ensaio-galego' }),
    });
    expect(metadata.title).toBe('Ensaio en galego');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/gl/articulo/ensaio-galego`);

    const ui = await ArticuloPage({
      params: Promise.resolve({ lang: 'gl', slug: 'ensaio-galego' }),
    });
    const { container } = render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Ensaio en galego' })).toBeInTheDocument();
    expect(screen.queryByText(/só está dispoñible/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Idioma orixinal:/i)).not.toBeInTheDocument();

    const articleBody = container.querySelector('.article-content');
    expect(articleBody).toHaveAttribute('lang', 'gl');
  });

  it('renders a bilingual publication on its non-original locale preserving the "Original in GL" link and no availability notice', async () => {
    const pub = makePublication({
      slug: 'ensaio-bilingue',
      title: { gl: 'Ensaio bilingüe', es: 'Ensayo bilingüe' },
      subtitle: { gl: 'Subtítulo GL', es: 'Subtítulo ES' },
      content: { gl: '<p>Contido GL.</p>', es: '<p>Contenido ES.</p>' },
      original_language: 'gl',
    });
    mockGetPublicationBySlug.mockResolvedValue(pub);

    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: 'es', slug: 'ensaio-bilingue' }),
    });
    expect(metadata.title).toBe('Ensayo bilingüe');
    expect(metadata.description).toBe('Subtítulo ES');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/es/articulo/ensaio-bilingue`);

    const ui = await ArticuloPage({
      params: Promise.resolve({ lang: 'es', slug: 'ensaio-bilingue' }),
    });
    const { container } = render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Ensayo bilingüe' })).toBeInTheDocument();
    expect(screen.getByText('Contenido ES.')).toBeInTheDocument();
    expect(screen.queryByText(/solo está disponible/i)).not.toBeInTheDocument();

    // Preserves "Idioma original: GL" link
    expect(screen.getByText(/Idioma original:/i)).toBeInTheDocument();
    const originalLink = screen.getByRole('link', { name: 'GL' });
    expect(originalLink).toHaveAttribute('href', '/gl/articulo/ensaio-bilingue');

    const articleBody = container.querySelector('.article-content');
    expect(articleBody).toHaveAttribute('lang', 'es');
  });
});
