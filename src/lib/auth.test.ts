import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  DB_TABLES,
  PERMISSIONS,
  USER_ROLES,
  resolvePermissionsForRoles,
} from '@/lib/db/schema';
import { getAuthenticatedUser, resolvePostAuthRedirectPath } from './auth';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

interface MockAuthSetup {
  user: User | null;
  userError?: { message: string } | null;
  profileRow?: Record<string, unknown> | null;
  profileError?: { message: string; code?: string } | null;
  userRoleRows?: unknown[];
  userRolesError?: { message: string } | null;
}

function makeSupabaseClient({
  user,
  userError = null,
  profileRow = null,
  profileError = null,
  userRoleRows = [],
  userRolesError = null,
}: MockAuthSetup): SupabaseClient {
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === DB_TABLES.USERS) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: profileRow,
              error: profileError,
            }),
          }),
        }),
      };
    }
    if (table === DB_TABLES.USER_ROLES) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: userRoleRows,
            error: userRolesError,
          }),
        }),
      };
    }
    throw new Error(`Unexpected table query: ${table}`);
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: userError,
      }),
    },
    from,
  } as unknown as SupabaseClient;
}

describe('server auth hydration (getAuthenticatedUser & resolvePostAuthRedirectPath)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null user/profile/role and empty roles/permissions when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient({ user: null, userError: { message: 'Auth session missing!' } })
    );

    const res = await getAuthenticatedUser();
    expect(res).toEqual({
      user: null,
      profile: null,
      roles: [],
      permissions: [],
      role: null,
    });
  });

  it('hydrates multi-role user roles and permissions from DB without using JWT app_metadata', async () => {
    const fakeUser = {
      id: 'usr-founder-admin',
      app_metadata: { user_role: USER_ROLES.READER },
    } as unknown as User;

    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient({
        user: fakeUser,
        profileRow: {
          id: 'usr-founder-admin',
          full_name: 'Ana',
          slug: 'ana',
          bio: null,
          avatar_url: null,
          newsletter_subscribed: false,
          role: USER_ROLES.READER,
        },
        userRoleRows: [
          {
            role_id: USER_ROLES.FOUNDER,
            roles: {
              id: USER_ROLES.FOUNDER,
              role_permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]).map((p) => ({
                permission: p,
              })),
            },
          },
          {
            role_id: USER_ROLES.ADMIN,
            roles: {
              id: USER_ROLES.ADMIN,
              role_permissions: resolvePermissionsForRoles([USER_ROLES.ADMIN]).map((p) => ({
                permission: p,
              })),
            },
          },
        ],
      })
    );

    const res = await getAuthenticatedUser();
    expect(res.user).toBe(fakeUser);
    expect(res.roles).toEqual([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]);
    expect(res.permissions).toHaveLength(19);
    expect(res.permissions).toContain(PERMISSIONS.USERS_ASSIGN_ROLE);
    expect(res.permissions).toContain(PERMISSIONS.PUBLICATIONS_PUBLISH);
    expect(res.role).toBe(USER_ROLES.ADMIN);
    expect(res.profile?.full_name).toBe('Ana');
  });

  it('fails closed to zero permissions and reader legacy role when user_roles is empty, ignoring JWT app_metadata.user_role', async () => {
    const fakeUser = {
      id: 'usr-zero-roles',
      app_metadata: { user_role: USER_ROLES.ADMIN },
    } as unknown as User;

    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient({
        user: fakeUser,
        profileRow: {
          id: 'usr-zero-roles',
          full_name: 'Zero Roles',
          slug: 'zero-roles',
          bio: null,
          avatar_url: null,
          newsletter_subscribed: false,
          role: USER_ROLES.ADMIN,
        },
        userRoleRows: [],
      })
    );

    const res = await getAuthenticatedUser();
    expect(res.user).toBe(fakeUser);
    expect(res.roles).toEqual([]);
    expect(res.permissions).toEqual([]);
    expect(res.role).toBe(USER_ROLES.READER);
  });

  it('routes post-auth redirect using DB desk:access permission and ignores JWT role claim', async () => {
    const writerClient = makeSupabaseClient({
      user: null,
      userRoleRows: [
        {
          role_id: USER_ROLES.GUEST,
          roles: {
            id: USER_ROLES.GUEST,
            role_permissions: [{ permission: PERMISSIONS.DESK_ACCESS }],
          },
        },
      ],
    });
    expect(
      await resolvePostAuthRedirectPath(
        { id: 'guest-1', app_metadata: { user_role: USER_ROLES.READER } },
        writerClient,
        'es'
      )
    ).toBe('/es/escritorio');

    const zeroRoleClient = makeSupabaseClient({
      user: null,
      userRoleRows: [],
    });
    expect(
      await resolvePostAuthRedirectPath(
        { id: 'zero-1', app_metadata: { user_role: USER_ROLES.ADMIN } },
        zeroRoleClient,
        'gl'
      )
    ).toBe('/gl/escritorio/perfil');

    const readerClient = makeSupabaseClient({
      user: null,
      userRoleRows: [
        {
          role_id: USER_ROLES.READER,
          roles: {
            id: USER_ROLES.READER,
            role_permissions: [],
          },
        },
      ],
    });
    expect(
      await resolvePostAuthRedirectPath({ id: 'reader-1' }, readerClient, 'gl')
    ).toBe('/gl/escritorio/perfil');

    const guestMemberClient = makeSupabaseClient({
      user: null,
      userRoleRows: [
        {
          role_id: USER_ROLES.GUEST,
          roles: {
            id: USER_ROLES.GUEST,
            role_permissions: resolvePermissionsForRoles([USER_ROLES.GUEST]).map((p) => ({
              permission: p,
            })),
          },
        },
        {
          role_id: USER_ROLES.MEMBER,
          roles: {
            id: USER_ROLES.MEMBER,
            role_permissions: resolvePermissionsForRoles([USER_ROLES.MEMBER]).map((p) => ({
              permission: p,
            })),
          },
        },
      ],
    });
    expect(
      await resolvePostAuthRedirectPath({ id: 'gm-1' }, guestMemberClient, 'gl')
    ).toBe('/gl/escritorio');

    const founderAdminClient = makeSupabaseClient({
      user: null,
      userRoleRows: [
        {
          role_id: USER_ROLES.FOUNDER,
          roles: {
            id: USER_ROLES.FOUNDER,
            role_permissions: resolvePermissionsForRoles([USER_ROLES.FOUNDER]).map((p) => ({
              permission: p,
            })),
          },
        },
        {
          role_id: USER_ROLES.ADMIN,
          roles: {
            id: USER_ROLES.ADMIN,
            role_permissions: resolvePermissionsForRoles([USER_ROLES.ADMIN]).map((p) => ({
              permission: p,
            })),
          },
        },
      ],
    });
    expect(
      await resolvePostAuthRedirectPath({ id: 'fa-1' }, founderAdminClient, 'es')
    ).toBe('/es/escritorio');

    const errorClient = makeSupabaseClient({
      user: null,
      userRolesError: { message: 'permission denied' },
    });
    expect(
      await resolvePostAuthRedirectPath({ id: 'err-1' }, errorClient, 'gl')
    ).toBe('/gl/escritorio/perfil');
  });
});
