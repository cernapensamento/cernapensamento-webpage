import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { getDictionaryClient } from '@/dictionaries/client';
import {
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  USER_ROLES,
} from '@/lib/db/schema';
import type { PublicationCardItem } from '@/lib/db/types';
import {
  resolvePublicationAuthor,
  resolvePublicationContent,
  resolvePublicationCover,
  resolvePublicationDate,
  resolvePublicationExcerpt,
  resolvePublicationHref,
  resolvePublicationLabels,
  resolvePublicationSubtitle,
  resolvePublicationTitle,
  resolvePublicationTypeLabel,
} from './publicationCardHelpers';
import ArticleCard from './ArticleCard';
import NewsMosaicGrid from './NewsMosaicGrid';
import RecentArticlesMosaicGrid from './RecentArticlesMosaicGrid';
import AuthorsDirectory, { type AuthorDirectoryItem } from './AuthorsDirectory';
import AuthorProfileView from './AuthorProfileView';
import ArticlesFilterBar from './ArticlesFilterBar';
import ArticlesArchiveList from './ArticlesArchiveList';
import CommentsSection from './CommentsSection';
import ProfileDashboard from './ProfileDashboard';

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockConfirm = vi.fn().mockResolvedValue(true);

let mockLocaleValue = 'gl';
let mockAuthUser: { id: string } | null = { id: 'user-1' };

const mockGetCommentsForPublication = vi.fn();
const mockDeleteComment = vi.fn();
const mockUpdateUserProfile = vi.fn();

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    sizes: _sizes,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) => {
    void _fill;
    void _priority;
    void _unoptimized;
    void _sizes;
    return React.createElement('img', { src, alt, ...rest });
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
  usePathname: () => `/${mockLocaleValue}/articulos`,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/useLocale', () => ({
  useLocale: () => mockLocaleValue,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockAuthUser, profile: null, loading: false }),
}));

vi.mock('@/components/ui/RevealOnScroll', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/FormattedDate', () => ({
  default: ({ date, className }: { date?: string; className?: string }) => (
    <time dateTime={date} className={className}>
      {date || ''}
    </time>
  ),
}));

vi.mock('@/components/ui/FeedbackProvider', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: vi.fn(),
  }),
  useConfirm: () => mockConfirm,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({}),
}));

vi.mock('@/actions/auth', () => ({
  handleSignOut: vi.fn(),
}));

vi.mock('@/actions/articles', () => ({
  fetchMoreArticlesAction: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/storage', () => ({
  uploadStorageImage: vi.fn(),
  removeStorageImages: vi.fn().mockResolvedValue(undefined),
  STORAGE_CATEGORIES: { PROFILE_AVATAR: 'profile-avatar' },
}));

vi.mock('@/components/forms/CommentForm', () => ({
  default: ({ articuloId }: { articuloId: string }) => (
    <div data-testid="comment-form">form:{articuloId}</div>
  ),
}));

vi.mock('@/components/forms/PasswordForm', () => ({
  default: () => <div data-testid="password-form">password-form</div>,
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getCommentsForPublication: (...args: unknown[]) => mockGetCommentsForPublication(...args),
    deleteComment: (...args: unknown[]) => mockDeleteComment(...args),
    updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
  };
});

describe('publicationCardHelpers', () => {
  it('resolves canonical JSONB, legacy fields, and non-binary 3rd-locale fallback', () => {
    const item = {
      id: 'pub-1',
      slug: 'liberdade-e-orde',
      type: PUBLICATION_TYPES.ESSAY,
      title: { gl: 'Título GL', es: 'Título ES', pt: 'Título PT' },
      subtitle: { gl: 'Subtítulo GL', es: 'Subtítulo ES' },
      content: { gl: '<p>Contido en <strong>galego</strong></p>', es: '<p>Contenido ES</p>' },
      cover_image_url: 'https://example.com/cover.webp',
      created_at: '2026-01-15T10:00:00Z',
      author: { full_name: 'Ana Seoane', avatar_url: 'https://example.com/ana.webp' },
      tags: [{ id: '1', name: 'Filosofía', slug: 'filosofia' }],
    };

    expect(resolvePublicationTitle(item, 'pt')).toBe('Título PT');
    expect(resolvePublicationSubtitle(item, 'pt')).toBe('Subtítulo GL');
    expect(resolvePublicationContent(item, 'es')).toBe('<p>Contenido ES</p>');
    expect(resolvePublicationExcerpt(null, resolvePublicationContent(item, 'gl'))).toBe(
      'Contido en galego...'
    );
    expect(resolvePublicationDate(item)).toBe('2026-01-15T10:00:00Z');
    expect(resolvePublicationCover(item)).toBe('https://example.com/cover.webp');
    expect(resolvePublicationAuthor(item, 'Descoñecido')).toEqual({
      name: 'Ana Seoane',
      avatar: 'https://example.com/ana.webp',
    });
    expect(resolvePublicationHref(item, 'pt')).toBe('/pt/articulo/liberdade-e-orde');

    const glDict = getDictionaryClient('gl');
    expect(
      resolvePublicationTypeLabel('ensayo', undefined, glDict, PUBLICATION_TYPES.ARTICLE)
    ).toBe(glDict.documentTypes.essay);
    expect(
      resolvePublicationLabels(item, { fallbackDict: glDict, maxTags: 2 })
    ).toEqual(['FILOSOFÍA']);
  });
});

describe('ArticleCard & mosaic grids i18n and localization', () => {
  const sampleArticle: PublicationCardItem = {
    id: 'pub-2',
    slug: 'teoria-monetaria',
    type: PUBLICATION_TYPES.ARTICLE,
    status: PUBLICATION_STATUSES.PUBLISHED,
    title: { gl: 'Teoría monetaria GL', es: 'Teoría monetaria ES' },
    subtitle: { gl: 'Resumo GL', es: 'Resumen ES' },
    cover_image_url: 'https://example.com/card.webp',
    created_at: '2026-02-01T12:00:00Z',
    updated_at: '2026-02-01T12:00:00Z',
    is_pinned: false,
    author: { id: 'a-1', full_name: 'Carlos Casares', slug: 'carlos', avatar_url: null },
    tags: [{ id: 't-1', name: 'Economía', slug: 'economia' }],
  };

  it('renders ArticleCard across variants using dictionary fallbacks and dynamic locale links', () => {
    const esDict = getDictionaryClient('es');

    const { rerender } = render(
      <ArticleCard articulo={sampleArticle} lang="es" variant="lead" />
    );
    expect(screen.getByText('Teoría monetaria ES')).toBeInTheDocument();
    expect(screen.getByText(esDict.articles.readArticle)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Teoría monetaria ES/i })[0]).toHaveAttribute(
      'href',
      '/es/articulo/teoria-monetaria'
    );

    rerender(<ArticleCard articulo={sampleArticle} lang="pt" variant="compact" />);
    expect(screen.getByText('Teoría monetaria GL')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Teoría monetaria GL/i })[0]
    ).toHaveAttribute('href', '/pt/articulo/teoria-monetaria');
  });

  it('renders NewsMosaicGrid empty state and articles with localized URLs', () => {
    const glDict = getDictionaryClient('gl');
    const { rerender } = render(<NewsMosaicGrid news={[]} lang="gl" />);
    expect(screen.getByText(glDict.noticias.emptyMessage)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: glDict.noticias.exploreButton })).toHaveAttribute(
      'href',
      '/gl/articulos'
    );

    rerender(
      <NewsMosaicGrid
        news={[{ ...sampleArticle, type: PUBLICATION_TYPES.NEWS }]}
        lang="es"
      />
    );
    expect(screen.getByRole('link', { name: /Teoría monetaria ES/i })).toHaveAttribute(
      'href',
      '/es/articulo/teoria-monetaria'
    );
  });

  it('renders RecentArticlesMosaicGrid items without hardcoded strings or binary lang checks', () => {
    render(<RecentArticlesMosaicGrid articulos={[sampleArticle]} lang="es" />);
    expect(screen.getByText('Teoría monetaria ES')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Teoría monetaria ES/i })).toHaveAttribute(
      'href',
      '/es/articulo/teoria-monetaria'
    );
  });
});

describe('AuthorsDirectory & AuthorProfileView', () => {
  const sampleAuthors: AuthorDirectoryItem[] = [
    {
      id: 'u-1',
      full_name: 'Beatriz Gómez',
      slug: 'beatriz-gomez',
      avatar_url: null,
      bio: 'Ensaísta',
      roles: [USER_ROLES.FOUNDER, USER_ROLES.GUEST],
      published_count: 3,
      latest_publication_at: '2026-02-10T10:00:00Z',
      latest_publication_title: 'Sobre a liberdade',
      latest_publication_slug: 'sobre-a-liberdade',
      publication_types: [PUBLICATION_TYPES.ESSAY],
    },
    {
      id: 'u-1b',
      full_name: 'Carmela Fundadora',
      slug: 'carmela-fundadora',
      avatar_url: null,
      bio: 'Fundadora e admin',
      roles: [USER_ROLES.FOUNDER, USER_ROLES.ADMIN],
      published_count: 4,
      latest_publication_at: '2026-02-15T10:00:00Z',
      latest_publication_title: 'Ensaio',
      latest_publication_slug: 'ensaio',
      publication_types: [PUBLICATION_TYPES.ESSAY],
    },
    {
      id: 'u-2',
      full_name: 'Álvaro Cunqueiro',
      slug: 'alvaro-cunqueiro',
      avatar_url: null,
      bio: 'Autor de crónicas',
      roles: [USER_ROLES.MEMBER, USER_ROLES.GUEST],
      published_count: 1,
      latest_publication_at: '2026-01-05T10:00:00Z',
      latest_publication_title: 'Crónica',
      latest_publication_slug: 'cronica',
      publication_types: [PUBLICATION_TYPES.COLUMN],
    },
    {
      id: 'u-3',
      full_name: 'Xesús Admin',
      slug: 'xesus-admin',
      avatar_url: null,
      bio: 'Xestor editorial',
      roles: [USER_ROLES.ADMIN],
      published_count: 2,
      latest_publication_at: '2026-01-20T10:00:00Z',
      latest_publication_title: 'Nota',
      latest_publication_slug: 'nota',
      publication_types: [PUBLICATION_TYPES.ARTICLE],
    },
    {
      id: 'u-4',
      full_name: 'Rosa Lectora',
      slug: 'rosa-lectora',
      avatar_url: null,
      bio: 'Lectora',
      roles: [USER_ROLES.READER],
      published_count: 1,
      latest_publication_at: '2026-01-01T10:00:00Z',
      latest_publication_title: 'Carta',
      latest_publication_slug: 'carta',
      publication_types: [PUBLICATION_TYPES.ARTICLE],
    },
  ];

  it('resolves public role badges by priority (founder > member > guest), hides admin/reader, and sorts cleanly', () => {
    const glDict = getDictionaryClient('gl');
    render(
      <AuthorsDirectory
        authors={sampleAuthors}
        lang="pt"
        dict={glDict.autoresPage}
        documentTypes={glDict.documentTypes}
      />
    );

    expect(screen.getAllByText(glDict.autoresPage.roles.founder)).toHaveLength(2);
    expect(screen.getAllByText(glDict.autoresPage.roles.contributor)).toHaveLength(1);
    expect(screen.queryByText(glDict.autoresPage.roles.editorialBoard)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(glDict.autoresPage.sortLabel), {
      target: { value: 'name' },
    });
    const links = screen.getAllByRole('link', {
      name: /Beatriz Gómez|Carmela Fundadora|Álvaro Cunqueiro|Xesús Admin|Rosa Lectora/,
    });
    expect(links[0]).toHaveAttribute('href', '/pt/autor/alvaro-cunqueiro');
  });

  it('normalizes publication types and resolves public badges by priority in AuthorProfileView without leaking admin', () => {
    const esDict = getDictionaryClient('es');
    const baseProps = {
      avatarSrc: '/default-avatar.png',
      bio: 'Bio ES',
      worksCountLabel: '2 publicaciones',
      availableTopics: [{ slug: 'filosofia', name: 'Filosofía', count: 2 }],
      publications: [
        {
          id: 'p-1',
          slug: 'obra-1',
          type: 'artigo',
          title: { es: 'Obra Un', gl: 'Obra Un GL' },
          subtitle: { es: 'Sub Un', gl: 'Sub Un GL' },
          created_at: '2026-03-01T10:00:00Z',
          tags: [{ id: 't-1', name: 'Filosofía', slug: 'filosofia' }],
        },
        {
          id: 'p-2',
          slug: 'obra-2',
          type: PUBLICATION_TYPES.ARTICLE,
          title: { es: 'Obra Dous', gl: 'Obra Dous GL' },
          created_at: '2026-02-01T10:00:00Z',
          tags: [{ id: 't-1', name: 'Filosofía', slug: 'filosofia' }],
        },
      ],
      lang: 'es',
      dict: esDict,
    };

    const { rerender } = render(
      <AuthorProfileView
        autor={{
          id: 'u-1',
          full_name: 'Beatriz Gómez',
          roles: [USER_ROLES.ADMIN],
          slug: 'beatriz-gomez',
        }}
        {...baseProps}
      />
    );

    expect(screen.queryByText(esDict.authorPage.editorialBoard)).not.toBeInTheDocument();
    expect(screen.queryByText(esDict.authorPage.foundingMember)).not.toBeInTheDocument();
    expect(screen.queryByText(esDict.authorPage.cernaContributor)).not.toBeInTheDocument();
    expect(screen.getByText('Obra Un')).toBeInTheDocument();
    expect(screen.getByText('Obra Dous')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Obra Un' })[0]).toHaveAttribute(
      'href',
      '/es/articulo/obra-1'
    );

    rerender(
      <AuthorProfileView
        autor={{
          id: 'u-2',
          full_name: 'Beatriz Gómez',
          roles: [USER_ROLES.FOUNDER, USER_ROLES.ADMIN],
          slug: 'beatriz-gomez',
        }}
        {...baseProps}
      />
    );
    expect(screen.getByText(esDict.authorPage.foundingMember)).toBeInTheDocument();
    expect(screen.queryByText(esDict.authorPage.editorialBoard)).not.toBeInTheDocument();

    rerender(
      <AuthorProfileView
        autor={{
          id: 'u-2b',
          full_name: 'Beatriz Gómez',
          roles: [USER_ROLES.FOUNDER, USER_ROLES.GUEST],
          slug: 'beatriz-gomez',
        }}
        {...baseProps}
      />
    );
    expect(screen.getByText(esDict.authorPage.foundingMember)).toBeInTheDocument();

    rerender(
      <AuthorProfileView
        autor={{
          id: 'u-3',
          full_name: 'Beatriz Gómez',
          roles: [USER_ROLES.MEMBER, USER_ROLES.GUEST],
          slug: 'beatriz-gomez',
        }}
        {...baseProps}
      />
    );
    expect(screen.getByText(esDict.authorPage.cernaContributor)).toBeInTheDocument();

    rerender(
      <AuthorProfileView
        autor={{
          id: 'u-4',
          full_name: 'Beatriz Gómez',
          roles: [USER_ROLES.READER],
          slug: 'beatriz-gomez',
        }}
        {...baseProps}
      />
    );
    expect(screen.queryByText(esDict.authorPage.cernaContributor)).not.toBeInTheDocument();
    expect(screen.queryByText(esDict.authorPage.foundingMember)).not.toBeInTheDocument();
  });
});

describe('ArticlesFilterBar & ArticlesArchiveList', () => {
  beforeEach(() => {
    mockLocaleValue = 'es';
    mockRouterPush.mockClear();
  });

  it('renders accessible dictionary labels in ArticlesFilterBar and localized empty state in ArchiveList', () => {
    const esDict = getDictionaryClient('es');
    render(
      <>
        <ArticlesFilterBar
          availableTags={[{ slug: 'historia', name: 'Historia' }]}
        />
        <ArticlesArchiveList initialArticles={[]} lang="es" filterOptions={{}} />
      </>
    );

    expect(
      screen.getByRole('textbox', { name: esDict.articles.searchPlaceholder })
    ).toBeInTheDocument();
    expect(screen.getByText(esDict.articles.noResults)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: esDict.articles.clearFilters })).toHaveAttribute(
      'href',
      '/es/articulos'
    );
  });
});

describe('CommentsSection & ProfileDashboard DAL integration', () => {
  beforeEach(() => {
    mockLocaleValue = 'gl';
    mockAuthUser = { id: 'user-1' };
    mockGetCommentsForPublication.mockReset();
    mockDeleteComment.mockReset();
    mockUpdateUserProfile.mockReset();
    mockToastError.mockReset();
  });

  it('loads and deletes comments exclusively through DAL functions', async () => {
    const glDict = getDictionaryClient('gl');
    mockGetCommentsForPublication.mockResolvedValue([
      {
        id: 'c-1',
        publication_id: 'pub-10',
        author_id: 'user-1',
        content: 'Excelente análise',
        updated_at: '2026-03-01T10:00:00Z',
        author: {
          id: 'user-1',
          full_name: 'Uxío Novoneyra',
          avatar_url: null,
          slug: 'uxio',
        },
      },
    ]);
    mockDeleteComment.mockResolvedValue({ success: true, error: null });

    render(<CommentsSection publicationId="pub-10" />);

    await waitFor(() => {
      expect(mockGetCommentsForPublication).toHaveBeenCalledWith('pub-10', {});
    });
    expect(await screen.findByText('Excelente análise')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: glDict.comments.delete }));
    await waitFor(() => {
      expect(mockDeleteComment).toHaveBeenCalledWith('c-1', {});
    });
  });

  it('updates user profile via updateUserProfile and sets structured status state', async () => {
    const glDict = getDictionaryClient('gl');
    mockUpdateUserProfile.mockResolvedValue({ error: null });

    render(
      <ProfileDashboard
        profile={{
          id: 'user-1',
          full_name: 'Rosalía de Castro',
          slug: 'rosalia',
          bio: { gl: 'Poeta galega' },
          avatar_url: null,
          newsletter_subscribed: true,
          role: USER_ROLES.FOUNDER,
        }}
        user={
          {
            id: 'user-1',
            email: 'rosalia@cerna.org',
            created_at: '2025-01-01T00:00:00Z',
            app_metadata: { providers: [] },
          } as unknown as User
        }
      />
    );

    expect(screen.getByText(glDict.dashboard.founder)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: glDict.dashboard.saveChanges }));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
    });
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(glDict.dashboard.profileSaved);

    mockUpdateUserProfile.mockResolvedValueOnce({
      error: new Error('Permission denied'),
    });
    fireEvent.click(screen.getByRole('button', { name: glDict.dashboard.saveChanges }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      `${glDict.dashboard.updateErrorPrefix} Permission denied`
    );
  });
});
