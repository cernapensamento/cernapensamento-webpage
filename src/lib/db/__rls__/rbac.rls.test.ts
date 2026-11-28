import { describe, it, expect, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const isDbTestEnabled = process.env.RUN_DB_TESTS === '1';

describe.skipIf(!isDbTestEnabled)('RBAC RLS Integration Tests (Local Supabase)', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const createdUserIds: string[] = [];

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await serviceClient.auth.admin.deleteUser(userId);
    }
  });

  async function createAuthenticatedClient(email: string, password = 'Password123!') {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(`Failed to sign in as ${email}: ${error?.message}`);
    }
    return { client, user: data.user };
  }

  async function createEphemeralUser(prefix: string, initialRole?: 'guest' | 'member') {
    const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
    const password = 'Password123!';
    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Test ${prefix}` },
    });
    if (error || !data.user) {
      throw new Error(`Failed to create ephemeral user ${email}: ${error?.message}`);
    }
    createdUserIds.push(data.user.id);
    if (initialRole) {
      await serviceClient.from('user_roles').delete().eq('user_id', data.user.id);
      const { error: roleError } = await serviceClient
        .from('user_roles')
        .insert({ user_id: data.user.id, role_id: initialRole });
      if (roleError) {
        throw new Error(`Failed to set role ${initialRole}: ${roleError.message}`);
      }
    }
    const { client } = await createAuthenticatedClient(email, password);
    return { userId: data.user.id, client };
  }

  it('restricts anonymous reads on roles and user_roles to is_public = true and blocks role_permissions', async () => {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: visibleRoles, error: rolesError } = await anonClient
      .from('roles')
      .select('id, is_public, public_priority')
      .order('public_priority', { ascending: true });

    expect(rolesError).toBeNull();
    expect(visibleRoles).toEqual([
      { id: 'founder', is_public: true, public_priority: 1 },
      { id: 'member', is_public: true, public_priority: 2 },
      { id: 'guest', is_public: true, public_priority: 3 },
    ]);

    const { error: permError } = await anonClient.from('role_permissions').select('role_id, permission');
    expect(permError).not.toBeNull();
    expect(permError?.code).toBe('42501');

    const { data: visibleUserRoles, error: urError } = await anonClient
      .from('user_roles')
      .select('user_id, role_id');

    expect(urError).toBeNull();
    const roleIds = new Set((visibleUserRoles ?? []).map((row) => row.role_id));
    expect(roleIds.has('admin')).toBe(false);
    expect(roleIds.has('reader')).toBe(false);
    expect(roleIds.has('founder')).toBe(true);
    expect(roleIds.has('member')).toBe(true);
    expect(roleIds.has('guest')).toBe(true);
  });

  it('assigns reader on signup, fails closed on zero roles, and reflects admin role grants/revocations immediately', async () => {
    const { userId, client: userClient } = await createEphemeralUser('rbac-lifecycle');
    const { client: adminClient } = await createAuthenticatedClient('admin@cernapensamento.org');

    // Signup assigns 'reader'
    const { data: initialRoles } = await userClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);
    expect(initialRoles).toEqual([{ role_id: 'reader' }]);

    // Reader cannot assign roles
    const { error: readerInsertError } = await userClient
      .from('user_roles')
      .insert({ user_id: userId, role_id: 'guest' });
    expect(readerInsertError).not.toBeNull();
    expect(readerInsertError?.code).toBe('42501');

    // Admin revokes reader -> zero-role user fails closed
    const { data: revokedReaderRows, error: revokeReaderError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', 'reader')
      .select('role_id');
    expect(revokeReaderError).toBeNull();
    expect(revokedReaderRows).toHaveLength(1);

    const { data: hasDeskZero } = await userClient.rpc('has_permission', {
      required_permission: 'desk:access',
    });
    expect(hasDeskZero).toBe(false);

    // Admin grants guest -> immediately visible without re-login / JWT refresh
    const { error: grantGuestError } = await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role_id: 'guest' });
    expect(grantGuestError).toBeNull();

    const { data: hasDeskAfterGrant } = await userClient.rpc('has_permission', {
      required_permission: 'desk:access',
    });
    expect(hasDeskAfterGrant).toBe(true);

    // Admin revokes guest -> immediately denied without JWT expiry
    const { error: revokeGuestError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', 'guest');
    expect(revokeGuestError).toBeNull();

    const { data: hasDeskAfterRevoke } = await userClient.rpc('has_permission', {
      required_permission: 'desk:access',
    });
    expect(hasDeskAfterRevoke).toBe(false);
  });

  it('denies user_roles mutations to founder and blocks deleting the last admin', async () => {
    const { client: founderClient } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');
    const { client: adminClient, user: adminUser } = await createAuthenticatedClient(
      'admin@cernapensamento.org'
    );

    const { error: founderInsertError } = await founderClient
      .from('user_roles')
      .insert({ user_id: 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', role_id: 'guest' });
    expect(founderInsertError).not.toBeNull();
    expect(founderInsertError?.code).toBe('42501');

    const { error: lastAdminDeleteError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', adminUser.id)
      .eq('role_id', 'admin');
    expect(lastAdminDeleteError).not.toBeNull();
    expect(lastAdminDeleteError?.message).toMatch(/last remaining admin/i);
  });

  it('enforces guest publication quota via RLS+trigger and lifts it when overlapping member role is added', async () => {
    const { userId, client: writerClient } = await createEphemeralUser('rbac-quota', 'guest');
    const { client: adminClient } = await createAuthenticatedClient('admin@cernapensamento.org');

    for (const idx of [1, 2]) {
      const { error } = await writerClient.from('publications').insert({
        author_id: userId,
        slug: `rbac-quota-${userId.slice(0, 8)}-${idx}-${Date.now()}`,
        title: { gl: `Proba ${idx}` },
        content: { gl: `<p>Contido ${idx}</p>` },
        status: 'draft',
        original_language: 'gl',
        type: 'article',
      });
      expect(error).toBeNull();
    }

    // 3rd publication in same year hits quota
    const { error: quotaError } = await writerClient.from('publications').insert({
      author_id: userId,
      slug: `rbac-quota-${userId.slice(0, 8)}-3-${Date.now()}`,
      title: { gl: 'Proba 3' },
      content: { gl: '<p>Contido 3</p>' },
      status: 'draft',
      original_language: 'gl',
      type: 'article',
    });
    expect(quotaError).not.toBeNull();
    expect(quotaError?.message).toMatch(/Límite anual alcanzado/i);

    // Admin adds overlapping 'member' role -> quota lifted immediately
    const { error: grantMemberError } = await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role_id: 'member' });
    expect(grantMemberError).toBeNull();

    const { error: liftedInsertError } = await writerClient.from('publications').insert({
      author_id: userId,
      slug: `rbac-quota-${userId.slice(0, 8)}-lifted-${Date.now()}`,
      title: { gl: 'Proba 3 sen límite' },
      content: { gl: '<p>Contido 3 sen límite</p>' },
      status: 'draft',
      original_language: 'gl',
      type: 'article',
    });
    expect(liftedInsertError).toBeNull();
  });
});
