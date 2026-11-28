import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EscritorioPage from './page';
import NuevoArticuloLayout from './nuevo/layout';
import NuevoArticuloPage from './nuevo/page';
import EditarArticuloPage from './editar/[slug]/page';
import {
  USER_ROLES,
  PERMISSIONS,
  PUBLICATION_STATUSES,
  resolvePermissionsForRoles,
  type PermissionValue,
} from '@/lib/db/schema';
import type { ProfileRow, PublicationDashboardItem, PublicationDetail, UserRole } from '@/lib/db/types';
import type { User } from '@supabase/supabase-js';

const mockGetAuthenticatedUser = vi.fn();
const mockGetDashboardPublications = vi.fn();
const mockGetGuestPublicationQuota = vi.fn();
const mockGetPublicationBySlug = vi.fn();
const mockRowSpy = vi.fn();
const mockFormSpy = vi.fn();

const mockRedirect = vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const mockNotFound = vi.fn((): never => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getDashboardPublications: (...args: unknown[]) => mockGetDashboardPublications(...args),
    getGuestPublicationQuota: (...args: unknown[]) => mockGetGuestPublicationQuota(...args),
    getPublicationBySlug: (...args: unknown[]) => mockGetPublicationBySlug(...args),
  };
});

vi.mock('@/components/escritorio/EscritorioPublicationRow', () => ({
  default: (props: Record<string, unknown>) => {
    mockRowSpy(props);
    return <div data-testid="publication-row" />;
  },
}));

vi.mock('@/components/forms/EditarArticuloForm', () => ({
  default: (props: Record<string, unknown>) => {
    mockFormSpy(props);
    return <div data-testid="editar-articulo-form" />;
  },
}));

function makeAuth(
  userId: string,
  permissions: readonly PermissionValue[],
  roles: UserRole[] = [],
  legacyRole: UserRole = USER_ROLES.READER
) {
  return {
    user: { id: userId } as unknown as User,
    profile: {
      id: userId,
      full_name: 'Test User',
      role: legacyRole,
      roles,
      permissions: [...permissions],
    } as unknown as ProfileRow,
    roles,
    permissions: [...permissions],
    role: legacyRole,
  };
}

const UNAUTH = {
  user: null,
  profile: null,
  roles: [],
  permissions: [],
  role: null,
};

function makeDashPub(id: string, status: 'draft' | 'in_review' | 'published' = 'draft'): PublicationDashboardItem {
  return {
    id,
    slug: `slug-${id}`,
    title: { gl: `Título ${id}` },
    subtitle: null,
    cover_image_url: null,
    type: 'article',
    status,
    original_language: 'gl',
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_id: 'user-1',
    author: { id: 'user-1', full_name: 'Author' },
  };
}

describe('Writer Desk route guards (atomic permissions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDashboardPublications.mockResolvedValue([]);
    mockGetGuestPublicationQuota.mockResolvedValue({
      totalCount: 0,
      yearlyCount: 0,
      totalLimit: 4,
      yearlyLimit: 2,
      canCreate: true,
    });
  });

  describe('EscritorioPage', () => {
    it('redirects unauthenticated users to login and users without desk:access to profile', async () => {
      mockGetAuthenticatedUser.mockResolvedValueOnce(UNAUTH);
      await expect(
        EscritorioPage({
          params: Promise.resolve({ lang: 'gl' }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toThrow('NEXT_REDIRECT:/gl/login');

      // Zero-role (even with legacy role: 'admin') must be blocked because permissions lack desk:access
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('zero-1', [], [], USER_ROLES.ADMIN)
      );
      await expect(
        EscritorioPage({
          params: Promise.resolve({ lang: 'es' }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toThrow('NEXT_REDIRECT:/es/escritorio/perfil');
    });

    it('treats guest as quota subject, but lifts quota for overlapping guest + member', async () => {
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth(
          'guest-1',
          resolvePermissionsForRoles([USER_ROLES.GUEST]),
          [USER_ROLES.GUEST],
          USER_ROLES.GUEST
        )
      );
      mockGetDashboardPublications.mockResolvedValueOnce([
        makeDashPub('1'),
        makeDashPub('2'),
        makeDashPub('3'),
        makeDashPub('4'),
      ]);

      const guestEl = await EscritorioPage({
        params: Promise.resolve({ lang: 'gl' }),
        searchParams: Promise.resolve({}),
      });
      const { unmount } = render(guestEl);
      expect(screen.getByText(/Autor Convidado/)).toBeInTheDocument();
      expect(screen.getByText(/Límite alcanzado/)).toBeInTheDocument();
      unmount();

      // Overlapping guest + member lifts quota
      const gmPerms = resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]);
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('gm-1', gmPerms, [USER_ROLES.GUEST, USER_ROLES.MEMBER], USER_ROLES.GUEST)
      );
      mockGetDashboardPublications.mockResolvedValueOnce([
        makeDashPub('1'),
        makeDashPub('2'),
        makeDashPub('3'),
        makeDashPub('4'),
      ]);

      const gmEl = await EscritorioPage({
        params: Promise.resolve({ lang: 'gl' }),
        searchParams: Promise.resolve({}),
      });
      render(gmEl);
      expect(screen.queryByText(/Autor Convidado/)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Crear Nova Publicación/i })).toBeInTheDocument();
    });

    it('passes permissions to EscritorioPublicationRow and shows review tab for founder + admin', async () => {
      const faPerms = resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]);
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('fa-1', faPerms, [USER_ROLES.FOUNDER, USER_ROLES.ADMIN], USER_ROLES.ADMIN)
      );
      mockGetDashboardPublications.mockResolvedValueOnce([makeDashPub('p1', 'in_review')]);

      const el = await EscritorioPage({
        params: Promise.resolve({ lang: 'gl' }),
        searchParams: Promise.resolve({ filtro: 'para_aprobar' }),
      });
      render(el);
      expect(screen.getByRole('link', { name: /Para aprobar/i })).toBeInTheDocument();
      expect(mockRowSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          canReview: true,
          permissions: faPerms,
        })
      );
    });
  });

  describe('NuevoArticuloLayout & NuevoArticuloPage', () => {
    it('redirects desk:access-only user lacking publications:create to /escritorio', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(
        makeAuth('desk-only', [PERMISSIONS.DESK_ACCESS], [], USER_ROLES.MEMBER)
      );

      await expect(
        NuevoArticuloLayout({
          children: <div>child</div>,
          params: Promise.resolve({ lang: 'gl' }),
        })
      ).rejects.toThrow('NEXT_REDIRECT:/gl/escritorio');

      await expect(
        NuevoArticuloPage({ params: Promise.resolve({ lang: 'gl' }) })
      ).rejects.toThrow('NEXT_REDIRECT:/gl/escritorio');
    });

    it('redirects guest at quota limit in layout, but allows guest + member without checking quota', async () => {
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('guest-1', resolvePermissionsForRoles([USER_ROLES.GUEST]), [USER_ROLES.GUEST])
      );
      mockGetGuestPublicationQuota.mockResolvedValueOnce({
        totalCount: 4,
        yearlyCount: 2,
        totalLimit: 4,
        yearlyLimit: 2,
        canCreate: false,
      });

      await expect(
        NuevoArticuloLayout({
          children: <div>child</div>,
          params: Promise.resolve({ lang: 'gl' }),
        })
      ).rejects.toThrow('NEXT_REDIRECT:/gl/escritorio?error=limite_alcanzado');

      const gmPerms = resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]);
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('gm-1', gmPerms, [USER_ROLES.GUEST, USER_ROLES.MEMBER], USER_ROLES.GUEST)
      );

      const layoutEl = await NuevoArticuloLayout({
        children: <div data-testid="nuevo-child">ok</div>,
        params: Promise.resolve({ lang: 'gl' }),
      });
      render(layoutEl);
      expect(mockGetGuestPublicationQuota).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('nuevo-child')).toBeInTheDocument();
    });

    it('passes permissions to EditarArticuloForm in NuevoArticuloPage', async () => {
      const perms = resolvePermissionsForRoles([USER_ROLES.MEMBER]);
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('member-1', perms, [USER_ROLES.MEMBER], USER_ROLES.MEMBER)
      );

      const pageEl = await NuevoArticuloPage({ params: Promise.resolve({ lang: 'gl' }) });
      render(pageEl);
      expect(mockFormSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'create',
          permissions: perms,
        })
      );
    });
  });

  describe('EditarArticuloPage', () => {
    it('blocks author lacking publications:publish from editing own published article', async () => {
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('member-1', resolvePermissionsForRoles([USER_ROLES.MEMBER]), [USER_ROLES.MEMBER])
      );
      mockGetPublicationBySlug.mockResolvedValueOnce({
        id: 'pub-1',
        slug: 'own-pub',
        status: PUBLICATION_STATUSES.PUBLISHED,
        author: { id: 'member-1' },
      } as unknown as PublicationDetail);

      await expect(
        EditarArticuloPage({ params: Promise.resolve({ lang: 'gl', slug: 'own-pub' }) })
      ).rejects.toThrow('NEXT_REDIRECT:/gl/escritorio');
    });

    it('allows publications:review on foreign in_review, blocks foreign draft, and passes permissions', async () => {
      const revPerms = [PERMISSIONS.DESK_ACCESS, PERMISSIONS.PUBLICATIONS_REVIEW];
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('reviewer-1', revPerms, [], USER_ROLES.READER)
      );
      mockGetPublicationBySlug.mockResolvedValueOnce({
        id: 'pub-rev',
        slug: 'foreign-rev',
        status: PUBLICATION_STATUSES.IN_REVIEW,
        author: { id: 'other-1' },
      } as unknown as PublicationDetail);

      const el = await EditarArticuloPage({
        params: Promise.resolve({ lang: 'gl', slug: 'foreign-rev' }),
      });
      render(el);
      expect(mockFormSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: revPerms,
        })
      );

      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('reviewer-1', revPerms, [], USER_ROLES.READER)
      );
      mockGetPublicationBySlug.mockResolvedValueOnce({
        id: 'pub-draft',
        slug: 'foreign-draft',
        status: PUBLICATION_STATUSES.DRAFT,
        author: { id: 'other-1' },
      } as unknown as PublicationDetail);

      await expect(
        EditarArticuloPage({ params: Promise.resolve({ lang: 'gl', slug: 'foreign-draft' }) })
      ).rejects.toThrow('NEXT_REDIRECT:/gl/escritorio');
    });

    it('allows publications:update_any on foreign draft', async () => {
      const anyPerms = [PERMISSIONS.DESK_ACCESS, PERMISSIONS.PUBLICATIONS_UPDATE_ANY];
      mockGetAuthenticatedUser.mockResolvedValueOnce(
        makeAuth('maint-1', anyPerms, [], USER_ROLES.READER)
      );
      mockGetPublicationBySlug.mockResolvedValueOnce({
        id: 'pub-draft',
        slug: 'foreign-draft',
        status: PUBLICATION_STATUSES.DRAFT,
        author: { id: 'other-1' },
      } as unknown as PublicationDetail);

      const el = await EditarArticuloPage({
        params: Promise.resolve({ lang: 'gl', slug: 'foreign-draft' }),
      });
      render(el);
      expect(mockFormSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: anyPerms,
        })
      );
    });
  });
});
