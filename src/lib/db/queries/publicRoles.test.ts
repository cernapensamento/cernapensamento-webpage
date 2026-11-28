import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DB_TABLES,
  PUBLICATION_COLS,
  USER_COLS,
  USER_ROLES,
  USER_ROLE_COLS,
} from '../schema';
import {
  getAuthorProfileBySlug,
  getColumnists,
  getPublishedAuthors,
  getUserById,
  getUserBySlug,
  getUserBySlugOrId,
} from './users';

describe('getColumnists (founder-only via user_roles)', () => {
  it('queries user_roles for founder with non-null slug and excludes admin-only users', async () => {
    const select = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const not = vi.fn().mockReturnThis();
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'u-founder-admin',
          full_name: 'Diego Araújo',
          slug: 'diego-araujo',
          bio: { gl: 'Ensaísta' },
          avatar_url: null,
          role: USER_ROLES.ADMIN,
          user_roles: [{ role_id: USER_ROLES.FOUNDER }, { role_id: USER_ROLES.ADMIN }],
        },
        {
          id: 'u-admin-only',
          full_name: 'Admin Only',
          slug: 'admin',
          bio: null,
          avatar_url: null,
          role: USER_ROLES.ADMIN,
          user_roles: [{ role_id: USER_ROLES.ADMIN }],
        },
        {
          id: 'u-null-slug',
          full_name: 'No Slug',
          slug: null,
          bio: null,
          avatar_url: null,
          role: USER_ROLES.FOUNDER,
          user_roles: [{ role_id: USER_ROLES.FOUNDER }],
        },
      ],
      error: null,
    });

    const from = vi.fn(() => ({ select, eq, not, order }));
    const client = { from } as unknown as SupabaseClient;

    const columnists = await getColumnists(client);

    expect(from).toHaveBeenCalledWith(DB_TABLES.USERS);
    expect(select.mock.calls[0][0]).toContain(`${DB_TABLES.USER_ROLES}!inner(${USER_ROLE_COLS.ROLE_ID})`);
    expect(eq).toHaveBeenCalledWith(`${DB_TABLES.USER_ROLES}.${USER_ROLE_COLS.ROLE_ID}`, USER_ROLES.FOUNDER);
    expect(not).toHaveBeenCalledWith(USER_COLS.SLUG, 'is', null);

    expect(columnists).toHaveLength(1);
    expect(columnists[0]).toMatchObject({
      id: 'u-founder-admin',
      slug: 'diego-araujo',
      roles: [USER_ROLES.FOUNDER],
    });
    expect(columnists[0].roles).not.toContain(USER_ROLES.ADMIN);
  });
});

describe('public user & author queries (is_public role filtering and priority)', () => {
  it('getUserBySlug, getUserBySlugOrId, and getUserById select user_roles and strip non-public roles', async () => {
    const selectCalls: string[] = [];
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'u-1',
        full_name: 'Ana',
        slug: 'ana',
        bio: null,
        avatar_url: null,
        role: USER_ROLES.ADMIN,
        user_roles: [
          { role_id: USER_ROLES.GUEST },
          { role_id: USER_ROLES.ADMIN },
          { role_id: USER_ROLES.FOUNDER },
          { role_id: USER_ROLES.READER },
        ],
      },
      error: null,
    });
    const client = {
      from: vi.fn(() => ({
        select: vi.fn((cols: string) => {
          selectCalls.push(cols);
          return {
            eq: vi.fn().mockReturnThis(),
            single,
          };
        }),
      })),
    } as unknown as SupabaseClient;

    const bySlug = await getUserBySlug('ana', client);
    const bySlugOrId = await getUserBySlugOrId('ana', client);
    const byId = await getUserById('c7b8d6f0-1234-5678-90ab-cdef12345678', client);

    expect(selectCalls[0]).toContain(`${DB_TABLES.USER_ROLES}(${USER_ROLE_COLS.ROLE_ID})`);
    expect(selectCalls[0]).not.toContain(USER_COLS.NEWSLETTER_SUBSCRIBED);
    expect(selectCalls[1]).toContain(`${DB_TABLES.USER_ROLES}(${USER_ROLE_COLS.ROLE_ID})`);
    expect(selectCalls[1]).not.toContain(USER_COLS.NEWSLETTER_SUBSCRIBED);
    expect(selectCalls[2]).toContain(`${DB_TABLES.USER_ROLES}(${USER_ROLE_COLS.ROLE_ID})`);
    expect(selectCalls[2]).toContain(USER_COLS.NEWSLETTER_SUBSCRIBED);

    for (const user of [bySlug, bySlugOrId, byId]) {
      expect(user?.roles).toEqual([USER_ROLES.FOUNDER, USER_ROLES.GUEST]);
      expect(user?.publicRole).toBe(USER_ROLES.FOUNDER);
      expect(user).not.toHaveProperty('user_roles');
    }
  });

  it('getPublishedAuthors filters out internal roles and resolves publicRole by priority', async () => {
    const selectCalls: string[] = [];
    const rows = [
      {
        id: 'pub-1',
        type: 'essay',
        created_at: '2026-03-01T10:00:00Z',
        published_at: '2026-03-01T10:00:00Z',
        slug: 'p1',
        title: { gl: 'P1' },
        original_language: 'gl',
        author_id: 'a-founder-guest',
        author: {
          id: 'a-founder-guest',
          full_name: 'Founder + Guest + Admin',
          slug: 'fga',
          bio: null,
          avatar_url: null,
          role: USER_ROLES.ADMIN,
          user_roles: [
            { role_id: USER_ROLES.GUEST },
            { role_id: USER_ROLES.ADMIN },
            { role_id: USER_ROLES.FOUNDER },
          ],
        },
      },
      {
        id: 'pub-2',
        type: 'article',
        created_at: '2026-02-01T10:00:00Z',
        published_at: '2026-02-01T10:00:00Z',
        slug: 'p2',
        title: { gl: 'P2' },
        original_language: 'gl',
        author_id: 'a-member-guest',
        author: {
          id: 'a-member-guest',
          full_name: 'Member + Guest',
          slug: 'mg',
          bio: null,
          avatar_url: null,
          role: USER_ROLES.GUEST,
          user_roles: [{ role_id: USER_ROLES.GUEST }, { role_id: USER_ROLES.MEMBER }],
        },
      },
      {
        id: 'pub-3',
        type: 'article',
        created_at: '2026-01-01T10:00:00Z',
        published_at: '2026-01-01T10:00:00Z',
        slug: 'p3',
        title: { gl: 'P3' },
        original_language: 'gl',
        author_id: 'a-admin-only',
        author: {
          id: 'a-admin-only',
          full_name: 'Admin Only',
          slug: 'admin-only',
          bio: null,
          avatar_url: null,
          role: USER_ROLES.ADMIN,
          user_roles: [{ role_id: USER_ROLES.ADMIN }, { role_id: USER_ROLES.READER }],
        },
      },
    ];

    const query = {
      select: vi.fn((cols: string) => {
        selectCalls.push(cols);
        return query;
      }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    const client = { from: vi.fn(() => query) } as unknown as SupabaseClient;

    const authors = await getPublishedAuthors(client);

    expect(selectCalls[0]).toContain(`${DB_TABLES.USER_ROLES}`);
    expect(selectCalls[0]).not.toContain(PUBLICATION_COLS.CONTENT);
    expect(selectCalls[0]).not.toContain(USER_COLS.NEWSLETTER_SUBSCRIBED);

    const byId = new Map(authors.map((a) => [a.id, a]));
    expect(byId.get('a-founder-guest')?.roles).toEqual([USER_ROLES.FOUNDER, USER_ROLES.GUEST]);
    expect(byId.get('a-founder-guest')?.publicRole).toBe(USER_ROLES.FOUNDER);

    expect(byId.get('a-member-guest')?.roles).toEqual([USER_ROLES.MEMBER, USER_ROLES.GUEST]);
    expect(byId.get('a-member-guest')?.publicRole).toBe(USER_ROLES.MEMBER);

    expect(byId.get('a-admin-only')?.roles).toEqual([]);
    expect(byId.get('a-admin-only')?.publicRole).toBeNull();
  });

  it('getAuthorProfileBySlug exposes filtered public roles and hides admin', async () => {
    const client = {
      from: vi.fn((table: string) => {
        if (table === DB_TABLES.USERS) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'u-prof',
                full_name: 'Admin Only Author',
                slug: 'admin-only-author',
                bio: null,
                avatar_url: null,
                role: USER_ROLES.ADMIN,
                user_roles: [{ role_id: USER_ROLES.ADMIN }],
              },
              error: null,
            }),
          };
        }
        const pubQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: (resolve: (val: unknown) => void) => resolve({ data: [], error: null }),
        };
        return pubQuery;
      }),
    } as unknown as SupabaseClient;

    const profile = await getAuthorProfileBySlug('admin-only-author', client, 'gl');
    expect(profile?.roles).toEqual([]);
    expect(profile?.publicRole).toBeNull();
  });
});
