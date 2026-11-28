import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DB_TABLES,
  PERMISSIONS,
  USER_ROLES,
  USER_ROLE_COLS,
  getUserRolesAndPermissions,
} from '@/lib/db';

function makeSupabaseMock(result: { data: unknown; error: unknown } | Error) {
  const eq = vi.fn().mockImplementation(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    eq,
  };
}

describe('getUserRolesAndPermissions', () => {
  it('queries user_roles with schema constants and parses nested PostgREST object permissions', async () => {
    const { client, from, eq } = makeSupabaseMock({
      data: [
        {
          role_id: USER_ROLES.GUEST,
          roles: {
            id: USER_ROLES.GUEST,
            role_permissions: [
              { permission: PERMISSIONS.DESK_ACCESS },
              { permission: PERMISSIONS.PUBLICATIONS_CREATE },
            ],
          },
        },
        {
          role_id: USER_ROLES.MEMBER,
          roles: {
            id: USER_ROLES.MEMBER,
            role_permissions: [
              { permission: PERMISSIONS.DESK_ACCESS },
              { permission: PERMISSIONS.PUBLICATIONS_CREATE },
              { permission: PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED },
            ],
          },
        },
      ],
      error: null,
    });

    const result = await getUserRolesAndPermissions('user-1', client);

    expect(from).toHaveBeenCalledWith(DB_TABLES.USER_ROLES);
    expect(eq).toHaveBeenCalledWith(USER_ROLE_COLS.USER_ID, 'user-1');
    expect(result.roles).toEqual([USER_ROLES.GUEST, USER_ROLES.MEMBER]);
    expect(result.permissions).toEqual([
      PERMISSIONS.DESK_ACCESS,
      PERMISSIONS.PUBLICATIONS_CREATE,
      PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED,
    ]);
  });

  it('handles array-shaped nested PostgREST roles and reader role with empty permissions', async () => {
    const { client } = makeSupabaseMock({
      data: [
        {
          role_id: USER_ROLES.READER,
          roles: [{ id: USER_ROLES.READER, role_permissions: [] }],
        },
      ],
      error: null,
    });

    const result = await getUserRolesAndPermissions('reader-1', client);
    expect(result).toEqual({
      roles: [USER_ROLES.READER],
      permissions: [],
    });
  });

  it('fails closed to empty roles and permissions when user has zero rows in user_roles', async () => {
    const { client } = makeSupabaseMock({ data: [], error: null });
    const result = await getUserRolesAndPermissions('zero-role-user', client);
    expect(result).toEqual({ roles: [], permissions: [] });
  });

  it('fails closed on DB error or thrown exception', async () => {
    const errMock = makeSupabaseMock({ data: null, error: { message: 'permission denied' } });
    expect(await getUserRolesAndPermissions('user-err', errMock.client)).toEqual({
      roles: [],
      permissions: [],
    });

    const throwMock = makeSupabaseMock(new Error('network failure'));
    expect(await getUserRolesAndPermissions('user-throw', throwMock.client)).toEqual({
      roles: [],
      permissions: [],
    });
  });

  it('fails closed for permissions when nested roles relation is null', async () => {
    const { client } = makeSupabaseMock({
      data: [{ role_id: USER_ROLES.ADMIN, roles: null }],
      error: null,
    });
    const result = await getUserRolesAndPermissions('user-null-rel', client);
    expect(result).toEqual({
      roles: [USER_ROLES.ADMIN],
      permissions: [],
    });
  });

  it('resolves permissions from ROLE_PERMISSIONS when simple { role_id } rows are returned without relation key', async () => {
    const { client } = makeSupabaseMock({
      data: [{ role_id: USER_ROLES.GUEST }, { role_id: USER_ROLES.GUEST }],
      error: null,
    });
    const result = await getUserRolesAndPermissions('user-simple', client);
    expect(result.roles).toEqual([USER_ROLES.GUEST]);
    expect(result.permissions).toContain(PERMISSIONS.DESK_ACCESS);
    expect(result.permissions).not.toContain(PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED);
  });
});
