import { describe, it, expect } from 'vitest';
import {
  DB_TABLES,
  ROLE_COLS,
  ROLE_PERMISSION_COLS,
  USER_ROLE_COLS,
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PUBLIC_ROLE_PRIORITY,
  ROLE_METADATA,
  resolvePermissionsForRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isGuestQuotaSubject,
  resolvePrimaryPublicRole,
} from './index';

describe('RBAC schema constants and permission helpers', () => {
  it('exposes normalized RBAC table and column identifiers', () => {
    expect(DB_TABLES.ROLES).toBe('roles');
    expect(DB_TABLES.ROLE_PERMISSIONS).toBe('role_permissions');
    expect(DB_TABLES.USER_ROLES).toBe('user_roles');

    expect(ROLE_COLS).toEqual({
      ID: 'id',
      IS_PUBLIC: 'is_public',
      PUBLIC_PRIORITY: 'public_priority',
    });
    expect(ROLE_PERMISSION_COLS).toEqual({
      ROLE_ID: 'role_id',
      PERMISSION: 'permission',
    });
    expect(USER_ROLE_COLS).toEqual({
      USER_ID: 'user_id',
      ROLE_ID: 'role_id',
      CREATED_AT: 'created_at',
    });
  });

  it('defines all 19 atomic resource:action permissions', () => {
    const values = Object.values(PERMISSIONS);
    expect(values).toHaveLength(19);
    expect(new Set(values).size).toBe(19);
    expect(values).toEqual(
      expect.arrayContaining([
        'desk:access',
        'ai:translate',
        'publications:create',
        'publications:update_own',
        'publications:delete_own',
        'publications:write_unlimited',
        'publications:review',
        'publications:publish',
        'publications:pin',
        'publications:update_any',
        'publications:delete_any',
        'media:upload_publication',
        'media:delete_any',
        'tags:create',
        'tags:update',
        'tags:delete',
        'comments:delete_any',
        'users:assign_role',
        'users:revoke_role',
      ])
    );
  });

  it('maps day-1 ROLE_PERMISSIONS and ROLE_METADATA accurately for all 5 roles', () => {
    expect(ROLE_PERMISSIONS[USER_ROLES.READER]).toEqual([]);
    expect(ROLE_PERMISSIONS[USER_ROLES.GUEST]).toHaveLength(7);
    expect(ROLE_PERMISSIONS[USER_ROLES.MEMBER]).toHaveLength(8);
    expect(ROLE_PERMISSIONS[USER_ROLES.FOUNDER]).toHaveLength(17);
    expect(ROLE_PERMISSIONS[USER_ROLES.ADMIN]).toHaveLength(19);

    expect(ROLE_PERMISSIONS[USER_ROLES.MEMBER]).toContain(PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED);
    expect(ROLE_PERMISSIONS[USER_ROLES.GUEST]).not.toContain(PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED);
    expect(ROLE_PERMISSIONS[USER_ROLES.FOUNDER]).not.toContain(PERMISSIONS.USERS_ASSIGN_ROLE);
    expect(ROLE_PERMISSIONS[USER_ROLES.ADMIN]).toEqual(
      expect.arrayContaining([PERMISSIONS.USERS_ASSIGN_ROLE, PERMISSIONS.USERS_REVOKE_ROLE])
    );

    expect(PUBLIC_ROLE_PRIORITY).toEqual([
      USER_ROLES.FOUNDER,
      USER_ROLES.MEMBER,
      USER_ROLES.GUEST,
    ]);
    expect(ROLE_METADATA[USER_ROLES.FOUNDER]).toEqual({ isPublic: true, publicPriority: 1 });
    expect(ROLE_METADATA[USER_ROLES.MEMBER]).toEqual({ isPublic: true, publicPriority: 2 });
    expect(ROLE_METADATA[USER_ROLES.GUEST]).toEqual({ isPublic: true, publicPriority: 3 });
    expect(ROLE_METADATA[USER_ROLES.ADMIN]).toEqual({ isPublic: false, publicPriority: null });
    expect(ROLE_METADATA[USER_ROLES.READER]).toEqual({ isPublic: false, publicPriority: null });
  });

  it('resolves multi-role permission unions without duplicates and fails closed on empty/unknown roles', () => {
    expect(resolvePermissionsForRoles([])).toEqual([]);
    expect(resolvePermissionsForRoles(null)).toEqual([]);
    expect(resolvePermissionsForRoles(undefined)).toEqual([]);
    expect(resolvePermissionsForRoles(['unknown_role'])).toEqual([]);
    expect(resolvePermissionsForRoles([USER_ROLES.READER])).toEqual([]);

    const guestMember = resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]);
    expect(guestMember).toHaveLength(8);
    expect(new Set(guestMember).size).toBe(8);
    expect(guestMember).toContain(PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED);

    const founderAdmin = resolvePermissionsForRoles([USER_ROLES.FOUNDER, USER_ROLES.ADMIN]);
    expect(founderAdmin).toHaveLength(19);
    expect(new Set(founderAdmin).size).toBe(19);
  });

  it('evaluates hasPermission, hasAnyPermission, and hasAllPermissions safely', () => {
    const perms = resolvePermissionsForRoles([USER_ROLES.MEMBER]);

    expect(hasPermission(perms, PERMISSIONS.DESK_ACCESS)).toBe(true);
    expect(hasPermission(perms, PERMISSIONS.PUBLICATIONS_PUBLISH)).toBe(false);
    expect(hasPermission([], PERMISSIONS.DESK_ACCESS)).toBe(false);
    expect(hasPermission(null, PERMISSIONS.DESK_ACCESS)).toBe(false);
    expect(hasPermission(perms, null)).toBe(false);

    expect(
      hasAnyPermission(perms, [PERMISSIONS.PUBLICATIONS_PUBLISH, PERMISSIONS.DESK_ACCESS])
    ).toBe(true);
    expect(
      hasAnyPermission(perms, [PERMISSIONS.PUBLICATIONS_PUBLISH, PERMISSIONS.USERS_ASSIGN_ROLE])
    ).toBe(false);
    expect(hasAnyPermission(perms, [])).toBe(false);
    expect(hasAnyPermission(null, [PERMISSIONS.DESK_ACCESS])).toBe(false);

    expect(
      hasAllPermissions(perms, [PERMISSIONS.DESK_ACCESS, PERMISSIONS.PUBLICATIONS_WRITE_UNLIMITED])
    ).toBe(true);
    expect(
      hasAllPermissions(perms, [PERMISSIONS.DESK_ACCESS, PERMISSIONS.PUBLICATIONS_PUBLISH])
    ).toBe(false);
    expect(hasAllPermissions(perms, [])).toBe(false);
    expect(hasAllPermissions(undefined, [PERMISSIONS.DESK_ACCESS])).toBe(false);
  });

  it('evaluates isGuestQuotaSubject strictly as publications:create without publications:write_unlimited', () => {
    expect(isGuestQuotaSubject(resolvePermissionsForRoles([USER_ROLES.GUEST]))).toBe(true);
    expect(
      isGuestQuotaSubject(resolvePermissionsForRoles([USER_ROLES.GUEST, USER_ROLES.MEMBER]))
    ).toBe(false);
    expect(isGuestQuotaSubject(resolvePermissionsForRoles([USER_ROLES.MEMBER]))).toBe(false);
    expect(isGuestQuotaSubject(resolvePermissionsForRoles([USER_ROLES.FOUNDER]))).toBe(false);
    expect(isGuestQuotaSubject(resolvePermissionsForRoles([USER_ROLES.ADMIN]))).toBe(false);
    expect(isGuestQuotaSubject(resolvePermissionsForRoles([USER_ROLES.READER]))).toBe(false);
    expect(isGuestQuotaSubject([])).toBe(false);
    expect(isGuestQuotaSubject(null)).toBe(false);
  });

  it('resolves primary public role by priority (founder > member > guest) and ignores internal roles', () => {
    expect(resolvePrimaryPublicRole([USER_ROLES.GUEST, USER_ROLES.MEMBER, USER_ROLES.FOUNDER])).toBe(
      USER_ROLES.FOUNDER
    );
    expect(resolvePrimaryPublicRole([USER_ROLES.ADMIN, USER_ROLES.FOUNDER])).toBe(
      USER_ROLES.FOUNDER
    );
    expect(resolvePrimaryPublicRole([USER_ROLES.GUEST, USER_ROLES.MEMBER])).toBe(
      USER_ROLES.MEMBER
    );
    expect(resolvePrimaryPublicRole([USER_ROLES.READER, USER_ROLES.GUEST])).toBe(USER_ROLES.GUEST);
    expect(resolvePrimaryPublicRole([USER_ROLES.ADMIN])).toBeNull();
    expect(resolvePrimaryPublicRole([USER_ROLES.READER])).toBeNull();
    expect(resolvePrimaryPublicRole([USER_ROLES.ADMIN, USER_ROLES.READER])).toBeNull();
    expect(resolvePrimaryPublicRole([])).toBeNull();
    expect(resolvePrimaryPublicRole(null)).toBeNull();
  });
});
