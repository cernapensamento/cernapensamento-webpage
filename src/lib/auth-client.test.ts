import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DB_TABLES,
  PERMISSIONS,
  USER_ROLES,
  resolvePermissionsForRoles,
} from '@/lib/db/schema';
import {
  fetchClientAuthProfile,
  resolveClientDeskRedirectPath,
} from './auth-client';

interface ClientMockOptions {
  userRow?: Record<string, unknown> | null;
  userError?: { message: string } | null;
  userRoleRows?: unknown[];
  userRolesError?: { message: string } | null;
}

function makeClientSupabase({
  userRow = null,
  userError = null,
  userRoleRows = [],
  userRolesError = null,
}: ClientMockOptions): SupabaseClient {
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === DB_TABLES.USERS) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: userRow,
              error: userError,
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
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from } as unknown as SupabaseClient;
}

describe('client auth hydration (fetchClientAuthProfile & resolveClientDeskRedirectPath)', () => {
  it('hydrates multi-role roles and permissions directly from user_roles and users', async () => {
    const supabase = makeClientSupabase({
      userRow: {
        avatar_url: 'https://example.com/a.webp',
        full_name: 'Lucia',
      },
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

    const profile = await fetchClientAuthProfile('usr-1', supabase);
    expect(profile).toEqual({
      roles: [USER_ROLES.GUEST, USER_ROLES.MEMBER],
      permissions: resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]),
      role: USER_ROLES.MEMBER,
      rol: USER_ROLES.MEMBER,
      avatar_url: 'https://example.com/a.webp',
      full_name: 'Lucia',
    });
  });

  it('fails closed to empty roles/permissions and reader legacy role when user_roles has zero rows', async () => {
    const supabase = makeClientSupabase({
      userRow: {
        avatar_url: null,
        full_name: 'No Roles',
      },
      userRoleRows: [],
    });

    const profile = await fetchClientAuthProfile('usr-zero', supabase);
    expect(profile).toEqual({
      roles: [],
      permissions: [],
      role: USER_ROLES.READER,
      rol: USER_ROLES.READER,
      avatar_url: null,
      full_name: 'No Roles',
    });
  });

  it('returns null when users query fails', async () => {
    const supabase = makeClientSupabase({
      userRow: null,
      userError: { message: 'not found' },
      userRoleRows: [],
    });

    expect(await fetchClientAuthProfile('missing', supabase)).toBeNull();
  });

  it('redirects based on DB desk:access permission and ignores JWT app_metadata.user_role', async () => {
    const writerSupabase = makeClientSupabase({
      userRow: { avatar_url: null, full_name: 'Writer' },
      userRoleRows: [
        {
          role_id: USER_ROLES.MEMBER,
          roles: {
            id: USER_ROLES.MEMBER,
            role_permissions: [{ permission: PERMISSIONS.DESK_ACCESS }],
          },
        },
      ],
    });

    expect(
      await resolveClientDeskRedirectPath(
        { id: 'writer-1', app_metadata: { user_role: USER_ROLES.READER } },
        writerSupabase,
        'gl'
      )
    ).toBe('/gl/escritorio');

    const zeroRoleSupabase = makeClientSupabase({
      userRow: { avatar_url: null, full_name: 'Zero' },
      userRoleRows: [],
    });

    expect(
      await resolveClientDeskRedirectPath(
        { id: 'zero-1', app_metadata: { user_role: USER_ROLES.ADMIN } },
        zeroRoleSupabase,
        'es'
      )
    ).toBe('/es/escritorio/perfil');

    const readerSupabase = makeClientSupabase({
      userRow: { avatar_url: null, full_name: 'Reader' },
      userRoleRows: [
        {
          role_id: USER_ROLES.READER,
          roles: { id: USER_ROLES.READER, role_permissions: [] },
        },
      ],
    });
    expect(
      await resolveClientDeskRedirectPath({ id: 'reader-1' }, readerSupabase, 'gl')
    ).toBe('/gl/escritorio/perfil');

    const gmSupabase = makeClientSupabase({
      userRow: { avatar_url: null, full_name: 'GM' },
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
      await resolveClientDeskRedirectPath({ id: 'gm-1' }, gmSupabase, 'gl')
    ).toBe('/gl/escritorio');

    const faSupabase = makeClientSupabase({
      userRow: { avatar_url: null, full_name: 'FA' },
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
      await resolveClientDeskRedirectPath({ id: 'fa-1' }, faSupabase, 'es')
    ).toBe('/es/escritorio');

    const failedProfileSupabase = makeClientSupabase({
      userRow: null,
      userError: { message: 'unauthorized' },
    });
    expect(
      await resolveClientDeskRedirectPath({ id: 'err-1' }, failedProfileSupabase, 'gl')
    ).toBe('/gl/escritorio/perfil');
  });
});
