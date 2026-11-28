import { describe, it, expect, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const isDbTestEnabled = process.env.RUN_DB_TESTS === '1';

describe.skipIf(!isDbTestEnabled)('Publications RLS Integration Tests (Local Supabase)', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  async function createAuthenticatedClient(email: string) {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: 'Password123!',
    });
    if (error || !data.user) {
      throw new Error(`Failed to sign in as ${email}: ${error?.message}`);
    }
    return { client, user: data.user };
  }

  it('rejects publication insertion by a reader', async () => {
    const { client, user } = await createAuthenticatedClient('lector@cerna.org');

    const { error } = await client.from('publications').insert({
      author_id: user.id,
      slug: `test-reader-${Date.now()}`,
      title: { gl: 'Test Reader', es: 'Test Reader' },
      content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
      status: 'in_review',
      type: 'article',
    });

    // RLS policy "Authors can insert publications" must deny reader insertions
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501'); // insufficient_privilege / RLS violation
  });

  it('allows a member to create a publication with in_review status', async () => {
    const { client, user } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
    const slug = `test-member-${Date.now()}`;

    const { data, error } = await client
      .from('publications')
      .insert({
        author_id: user.id,
        slug,
        title: { gl: 'Proposta de Membro', es: 'Propuesta de Miembro' },
        content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
        status: 'in_review',
        type: 'article',
      })
      .select('id, slug, status')
      .single();

    expect(error).toBeNull();
    expect(data?.slug).toBe(slug);
    expect(data?.status).toBe('in_review');

    // Cleanup created test publication
    if (data?.id) {
      const adminClient = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      );
      await adminClient.from('publications').delete().eq('id', data.id);
    }
  });

  it('allows a founder to publish articles directly', async () => {
    const { client, user } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');
    const slug = `test-founder-${Date.now()}`;

    const { data, error } = await client
      .from('publications')
      .insert({
        author_id: user.id,
        slug,
        title: { gl: 'Artigo Fundador', es: 'Artículo Fundador' },
        content: { gl: '<p>Contido editorial</p>', es: '<p>Contenido editorial</p>' },
        status: 'published',
        type: 'article',
      })
      .select('id, slug, status')
      .single();

    expect(error).toBeNull();
    expect(data?.slug).toBe(slug);
    expect(data?.status).toBe('published');

    // Cleanup created test publication
    if (data?.id) {
      const adminClient = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      );
      await adminClient.from('publications').delete().eq('id', data.id);
    }
  });

  it('allows a member to delete their own in_review publication but denies deleting published publications', async () => {
    const { client, user } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );

    // 1. Create an in_review publication
    const slugDraft = `test-member-del-${Date.now()}`;
    const { data: draftPub } = await client
      .from('publications')
      .insert({
        author_id: user.id,
        slug: slugDraft,
        title: { gl: 'Borrador a borrar', es: 'Borrador a borrar' },
        content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
        status: 'in_review',
        type: 'article',
      })
      .select('id')
      .single();

    expect(draftPub?.id).toBeDefined();

    // Member CAN delete own in_review publication
    const { error: delDraftErr, data: delDraftData } = await client
      .from('publications')
      .delete()
      .eq('id', draftPub!.id)
      .select('id');

    expect(delDraftErr).toBeNull();
    expect(delDraftData?.length).toBe(1);

    // 2. Create a published publication for this member via admin client
    const slugPub = `test-member-published-${Date.now()}`;
    const { data: publishedPub } = await adminClient
      .from('publications')
      .insert({
        author_id: user.id,
        slug: slugPub,
        title: { gl: 'Publicado', es: 'Publicado' },
        content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
        status: 'published',
        type: 'article',
      })
      .select('id')
      .single();

    expect(publishedPub?.id).toBeDefined();

    // Member CANNOT delete their own published publication
    const { data: delPubData } = await client
      .from('publications')
      .delete()
      .eq('id', publishedPub!.id)
      .select('id');

    expect(delPubData?.length).toBe(0);

    // Cleanup via admin
    await adminClient.from('publications').delete().eq('id', publishedPub!.id);
  });

  it('allows a founder to delete any publication', async () => {
    const { client: founderClient } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');
    const { user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );

    const slug = `test-founder-del-target-${Date.now()}`;
    const { data: targetPub } = await adminClient
      .from('publications')
      .insert({
        author_id: memberUser.id,
        slug,
        title: { gl: 'Artigo dun membro', es: 'Artículo de un miembro' },
        content: { gl: '<p>Contido</p>', es: '<p>Contenido</p>' },
        status: 'published',
        type: 'article',
      })
      .select('id')
      .single();

    expect(targetPub?.id).toBeDefined();

    // Founder can delete it
    const { error: delErr, data: delData } = await founderClient
      .from('publications')
      .delete()
      .eq('id', targetPub!.id)
      .select('id');

    expect(delErr).toBeNull();
    expect(delData?.length).toBe(1);
  });

  it('denies a member from modifying tags on another authors publication', async () => {
    const { client: memberClient } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
    const { user: founderUser } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');
    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );

    // Create a tag
    const { data: tag } = await adminClient
      .from('tags')
      .insert({ slug: `test-tag-${Date.now()}` })
      .select('id')
      .single();

    // Create publication owned by founder
    const { data: founderPub } = await adminClient
      .from('publications')
      .insert({
        author_id: founderUser.id,
        slug: `founder-pub-${Date.now()}`,
        title: { gl: 'Titulo', es: 'Titulo' },
        content: { gl: '<p>c</p>', es: '<p>c</p>' },
        status: 'published',
        type: 'article',
      })
      .select('id')
      .single();

    // Member attempts to attach tag to founder publication -> Denied by RLS
    const { error: tagInsertErr } = await memberClient
      .from('publication_tags')
      .insert({
        publication_id: founderPub!.id,
        tag_id: tag!.id,
      });

    expect(tagInsertErr).not.toBeNull();
    expect(tagInsertErr?.code).toBe('42501');

    // Cleanup
    await adminClient.from('publications').delete().eq('id', founderPub!.id);
    await adminClient.from('tags').delete().eq('id', tag!.id);
  });

  it('denies an anonymous client from reading newsletter_subscribed on users', async () => {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await anonClient
      .from('users')
      .select('id, full_name, newsletter_subscribed')
      .limit(1);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501'); // Permission denied for column newsletter_subscribed
  });

  it('allows an anonymous client to read public author profile columns on users', async () => {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await anonClient
      .from('users')
      .select('id, full_name, slug, bio, avatar_url')
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('allows an authenticated founder to insert and update show_index on publications', async () => {
    const { client, user } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');
    const slug = `test-show-index-${Date.now()}`;

    const { data: inserted, error: insertError } = await client
      .from('publications')
      .insert({
        author_id: user.id,
        slug,
        title: { gl: 'Índice test', es: 'Índice test' },
        content: { gl: '<h2>Sección</h2><p>Texto</p>', es: '<h2>Sección</h2><p>Texto</p>' },
        status: 'draft',
        type: 'article',
        show_index: true,
      })
      .select('id, show_index')
      .single();

    expect(insertError).toBeNull();
    expect(inserted?.show_index).toBe(true);

    const { data: updated, error: updateError } = await client
      .from('publications')
      .update({ show_index: false })
      .eq('id', inserted!.id)
      .select('id, show_index')
      .single();

    expect(updateError).toBeNull();
    expect(updated?.show_index).toBe(false);

    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
    await adminClient.from('publications').delete().eq('id', inserted!.id);
  });

  it('denies a reader from updating an unpublished publication they own', async () => {
    const { client: readerClient, user: readerUser } = await createAuthenticatedClient('lector@cerna.org');
    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );

    const { data: draftPub } = await adminClient
      .from('publications')
      .insert({
        author_id: readerUser.id,
        slug: `test-reader-owned-draft-${Date.now()}`,
        title: { gl: 'Borrador lector', es: 'Borrador lector' },
        content: { gl: '<p>c</p>', es: '<p>c</p>' },
        status: 'draft',
        type: 'article',
      })
      .select('id')
      .single();

    expect(draftPub?.id).toBeDefined();

    const { data: updatedRows, error: updateErr } = await readerClient
      .from('publications')
      .update({ title: { gl: 'Modificado', es: 'Modificado' } })
      .eq('id', draftPub!.id)
      .select('id');

    expect(updateErr?.code === '42501' || (Array.isArray(updatedRows) && updatedRows.length === 0)).toBe(true);

    await adminClient.from('publications').delete().eq('id', draftPub!.id);
  });

  it('allows monolingual gl-only, es-only, and partial draft writes while rejecting invalid rows', async () => {
    const { client: founderClient, user: founderUser } = await createAuthenticatedClient(
      'diegoaraujo@cernapensamento.org'
    );
    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
    const createdIds: string[] = [];

    try {
      // 1. gl-only published
      const { data: glPub, error: glErr } = await founderClient
        .from('publications')
        .insert({
          author_id: founderUser.id,
          slug: `test-mono-gl-${Date.now()}`,
          original_language: 'gl',
          title: { gl: 'Só en galego' },
          subtitle: { gl: 'Subtítulo' },
          content: { gl: '<p>Contido en galego</p>' },
          status: 'published',
          type: 'article',
        })
        .select('id, original_language')
        .single();

      expect(glErr).toBeNull();
      expect(glPub?.original_language).toBe('gl');
      if (glPub?.id) createdIds.push(glPub.id);

      // 2. es-only published
      const { data: esPub, error: esErr } = await founderClient
        .from('publications')
        .insert({
          author_id: founderUser.id,
          slug: `test-mono-es-${Date.now()}`,
          original_language: 'es',
          title: { es: 'Solo en español' },
          subtitle: null,
          content: { es: '<p>Contenido en español</p>' },
          status: 'published',
          type: 'article',
        })
        .select('id, original_language')
        .single();

      expect(esErr).toBeNull();
      expect(esPub?.original_language).toBe('es');
      if (esPub?.id) createdIds.push(esPub.id);

      // 3. Partial untitled draft (content only)
      const { data: draftPub, error: draftErr } = await founderClient
        .from('publications')
        .insert({
          author_id: founderUser.id,
          slug: `test-partial-draft-${Date.now()}`,
          original_language: 'es',
          title: {},
          content: { es: '<p>Borrador parcial</p>' },
          status: 'draft',
          type: 'article',
        })
        .select('id, status')
        .single();

      expect(draftErr).toBeNull();
      expect(draftPub?.status).toBe('draft');
      if (draftPub?.id) createdIds.push(draftPub.id);

      // 4. Invalid published row (missing original_language content)
      const { error: invalidErr } = await founderClient.from('publications').insert({
        author_id: founderUser.id,
        slug: `test-invalid-mono-${Date.now()}`,
        original_language: 'es',
        title: { gl: 'Só galego' },
        content: { gl: '<p>Só galego</p>' },
        status: 'published',
        type: 'article',
      });

      expect(invalidErr).not.toBeNull();
      expect(invalidErr?.code).toBe('23514');
    } finally {
      for (const id of createdIds) {
        await adminClient.from('publications').delete().eq('id', id);
      }
    }
  });

  describe('Permission-based table RLS (publications, tags, comments)', () => {
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const createdUserIds: string[] = [];
    const createdRoleIds: string[] = [];
    const createdPubIds: string[] = [];
    const createdTagIds: string[] = [];

    afterAll(async () => {
      for (const pubId of createdPubIds) {
        await serviceClient.from('publications').delete().eq('id', pubId);
      }
      for (const tagId of createdTagIds) {
        await serviceClient.from('tags').delete().eq('id', tagId);
      }
      for (const userId of createdUserIds) {
        await serviceClient.auth.admin.deleteUser(userId);
      }
      for (const roleId of createdRoleIds) {
        await serviceClient.from('roles').delete().eq('id', roleId);
      }
    });

    async function createCustomRole(prefix: string, permissions: string[]) {
      const roleId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.toLowerCase();
      const { error: roleErr } = await serviceClient
        .from('roles')
        .insert({ id: roleId, is_public: false, public_priority: null });
      if (roleErr) throw new Error(`Failed to create role ${roleId}: ${roleErr.message}`);
      createdRoleIds.push(roleId);

      if (permissions.length > 0) {
        const { error: permErr } = await serviceClient
          .from('role_permissions')
          .insert(permissions.map((permission) => ({ role_id: roleId, permission })));
        if (permErr) throw new Error(`Failed to seed perms for ${roleId}: ${permErr.message}`);
      }
      return roleId;
    }

    async function createUserWithRoles(prefix: string, roles: string[]) {
      const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
      const password = 'Password123!';
      const { data, error } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Test ${prefix}` },
      });
      if (error || !data.user) {
        throw new Error(`Failed to create user ${email}: ${error?.message}`);
      }
      createdUserIds.push(data.user.id);

      // Remove default 'reader' role assigned by handle_new_user so exact role list applies
      await serviceClient.from('user_roles').delete().eq('user_id', data.user.id);

      if (roles.length > 0) {
        const { error: assignErr } = await serviceClient
          .from('user_roles')
          .insert(roles.map((roleId) => ({ user_id: data.user!.id, role_id: roleId })));
        if (assignErr) throw new Error(`Failed to assign roles ${roles.join(',')}: ${assignErr.message}`);
      }

      const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
      if (signInErr) throw new Error(`Failed to sign in ${email}: ${signInErr.message}`);

      return { userId: data.user.id, client };
    }

    async function seedPublication(
      authorId: string,
      status: 'draft' | 'in_review' | 'published',
      overrides: Record<string, unknown> = {}
    ) {
      const { data, error } = await serviceClient
        .from('publications')
        .insert({
          author_id: authorId,
          slug: `rls-pub-${status}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          original_language: 'gl',
          title: { gl: `Título ${status}` },
          content: { gl: `<p>Contido ${status}</p>` },
          status,
          type: 'article',
          ...overrides,
        })
        .select('id, status, is_pinned, title')
        .single();
      if (error || !data) throw new Error(`Failed to seed publication: ${error?.message}`);
      createdPubIds.push(data.id);
      return data;
    }

    it('fails closed for zero-role users on publications INSERT, UPDATE, DELETE, and hidden SELECTs', async () => {
      const { userId: zeroUserId, client: zeroClient } = await createUserWithRoles('zero-pub', []);
      const { user: founderUser } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');

      const zeroDraft = await seedPublication(zeroUserId, 'draft');
      const founderDraft = await seedPublication(founderUser.id, 'draft');
      const founderReview = await seedPublication(founderUser.id, 'in_review');

      // Cannot insert
      const { error: insertErr } = await zeroClient.from('publications').insert({
        author_id: zeroUserId,
        slug: `zero-insert-${Date.now()}`,
        original_language: 'gl',
        title: { gl: 'Zero' },
        content: { gl: '<p>Zero</p>' },
        status: 'draft',
        type: 'article',
      });
      expect(insertErr?.code).toBe('42501');

      // Cannot update own draft
      const { data: updatedRows, error: updateErr } = await zeroClient
        .from('publications')
        .update({ title: { gl: 'Modificado' } })
        .eq('id', zeroDraft.id)
        .select('id');
      expect(updateErr?.code === '42501' || (Array.isArray(updatedRows) && updatedRows.length === 0)).toBe(true);

      // Cannot delete own draft
      const { data: deletedRows } = await zeroClient
        .from('publications')
        .delete()
        .eq('id', zeroDraft.id)
        .select('id');
      expect(deletedRows?.length ?? 0).toBe(0);

      // Cannot view other author's draft or in_review
      const { data: hiddenRows } = await zeroClient
        .from('publications')
        .select('id')
        .in('id', [founderDraft.id, founderReview.id]);
      expect(hiddenRows).toEqual([]);
    });

    it('enforces publications:pin on pin/unpin and blocks non-pin field edits for pin-only users', async () => {
      const pinOnlyRole = await createCustomRole('test_pin_only', ['publications:pin']);
      const updateAnyNoPinRole = await createCustomRole('test_update_no_pin', [
        'publications:create',
        'publications:update_any',
      ]);
      const updateOwnPinRole = await createCustomRole('test_own_and_pin', [
        'publications:create',
        'publications:update_own',
        'publications:pin',
      ]);

      const { client: pinClient } = await createUserWithRoles('pinner', [pinOnlyRole]);
      const { userId: anyUserId, client: anyClient } = await createUserWithRoles('any-no-pin', [updateAnyNoPinRole]);
      const { userId: ownPinUserId, client: ownPinClient } = await createUserWithRoles('own-pin', [updateOwnPinRole]);
      const { user: founderUser } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');

      const publishedPub = await seedPublication(founderUser.id, 'published', { is_pinned: false });
      const ownDraft = await seedPublication(ownPinUserId, 'draft', { is_pinned: false });

      // Pin-only user CAN pin and unpin published publication
      const { data: pinned, error: pinErr } = await pinClient
        .from('publications')
        .update({ is_pinned: true })
        .eq('id', publishedPub.id)
        .select('id, is_pinned')
        .single();
      expect(pinErr).toBeNull();
      expect(pinned?.is_pinned).toBe(true);

      const { data: unpinned, error: unpinErr } = await pinClient
        .from('publications')
        .update({ is_pinned: false })
        .eq('id', publishedPub.id)
        .select('id, is_pinned')
        .single();
      expect(unpinErr).toBeNull();
      expect(unpinned?.is_pinned).toBe(false);

      // Pin-only user CANNOT mutate non-pin fields (e.g., title) on published publication
      const { error: nonPinEditErr } = await pinClient
        .from('publications')
        .update({ is_pinned: true, title: { gl: 'Hijacked title' } })
        .eq('id', publishedPub.id);
      expect(nonPinEditErr).not.toBeNull();
      expect(nonPinEditErr?.code).toBe('42501');

      const { error: titleOnlyErr } = await pinClient
        .from('publications')
        .update({ title: { gl: 'Hijacked title only' } })
        .eq('id', publishedPub.id);
      expect(titleOnlyErr).not.toBeNull();
      expect(titleOnlyErr?.code).toBe('42501');

      // publications:update_any WITHOUT publications:pin CANNOT insert with is_pinned=true or pin via update
      const { error: insertPinDenied } = await anyClient.from('publications').insert({
        author_id: anyUserId,
        slug: `no-pin-insert-${Date.now()}`,
        original_language: 'gl',
        title: { gl: 'No pin' },
        content: { gl: '<p>No pin</p>' },
        status: 'draft',
        is_pinned: true,
        type: 'article',
      });
      expect(insertPinDenied).not.toBeNull();
      expect(insertPinDenied?.code).toBe('42501');

      const { error: updatePinDenied } = await anyClient
        .from('publications')
        .update({ is_pinned: true })
        .eq('id', publishedPub.id);
      expect(updatePinDenied).not.toBeNull();
      expect(updatePinDenied?.code).toBe('42501');

      // publications:update_any WITHOUT publications:pin CAN update title when not changing is_pinned
      const { error: anyTitleErr } = await anyClient
        .from('publications')
        .update({ title: { gl: 'Edited by update_any' } })
        .eq('id', publishedPub.id);
      expect(anyTitleErr).toBeNull();

      // publications:update_own + publications:pin WITHOUT publications:publish CANNOT publish own draft
      const { error: bypassPublishErr } = await ownPinClient
        .from('publications')
        .update({ status: 'published', is_pinned: true })
        .eq('id', ownDraft.id);
      expect(bypassPublishErr).not.toBeNull();
      expect(bypassPublishErr?.code).toBe('42501');
    });

    it('enforces publications:review on in_review reads and updates without granting draft or pin access', async () => {
      const reviewOnlyRole = await createCustomRole('test_review_only', ['publications:review']);
      const { client: reviewClient } = await createUserWithRoles('reviewer', [reviewOnlyRole]);
      const { user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');

      const memberDraft = await seedPublication(memberUser.id, 'draft');
      const memberInReview = await seedPublication(memberUser.id, 'in_review');
      const memberPublished = await seedPublication(memberUser.id, 'published');

      // Can SELECT in_review, cannot SELECT other author's draft
      const { data: visible } = await reviewClient
        .from('publications')
        .select('id')
        .in('id', [memberDraft.id, memberInReview.id]);
      expect(visible?.map((r) => r.id)).toEqual([memberInReview.id]);

      // Cannot pin in_review without publications:pin
      const { error: reviewPinErr } = await reviewClient
        .from('publications')
        .update({ is_pinned: true })
        .eq('id', memberInReview.id);
      expect(reviewPinErr?.code).toBe('42501');

      // Cannot update other author's published publication
      const { data: pubUpdateRows, error: pubUpdateErr } = await reviewClient
        .from('publications')
        .update({ title: { gl: 'No perm' } })
        .eq('id', memberPublished.id)
        .select('id');
      expect(pubUpdateErr?.code === '42501' || (Array.isArray(pubUpdateRows) && pubUpdateRows.length === 0)).toBe(true);

      // Can approve in_review -> published
      const { data: approved, error: approveErr } = await reviewClient
        .from('publications')
        .update({ status: 'published' })
        .eq('id', memberInReview.id)
        .select('id, status')
        .single();
      expect(approveErr).toBeNull();
      expect(approved?.status).toBe('published');
    });

    it('enforces publications:publish on own published edits and supports overlapping multi-role users', async () => {
      const publishOnlyRole = await createCustomRole('test_publish_only', [
        'publications:create',
        'publications:publish',
      ]);
      const { userId: pubUserId, client: pubClient } = await createUserWithRoles('publisher', [publishOnlyRole]);
      const { client: memberClient, user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const { client: dualWriterClient, userId: dualWriterId } = await createUserWithRoles('guest-member', [
        'guest',
        'member',
      ]);
      const { client: founderAdminClient, userId: founderAdminId } = await createUserWithRoles('founder-admin', [
        'founder',
        'admin',
      ]);

      const ownPublished = await seedPublication(pubUserId, 'published');
      const memberPublished = await seedPublication(memberUser.id, 'published');

      // Member without publications:publish cannot edit own published publication
      const { data: memberEditRows } = await memberClient
        .from('publications')
        .update({ title: { gl: 'Member edit published' } })
        .eq('id', memberPublished.id)
        .select('id');
      expect(memberEditRows?.length ?? 0).toBe(0);

      // User with publications:publish CAN edit own published publication
      const { data: ownEdited, error: ownEditErr } = await pubClient
        .from('publications')
        .update({ title: { gl: 'Publisher updated own' } })
        .eq('id', ownPublished.id)
        .select('id, title')
        .single();
      expect(ownEditErr).toBeNull();
      expect((ownEdited?.title as { gl?: string })?.gl).toBe('Publisher updated own');

      // Overlapping guest + member can insert in_review, cannot direct publish
      const { data: dualDraft, error: dualInsertErr } = await dualWriterClient
        .from('publications')
        .insert({
          author_id: dualWriterId,
          slug: `dual-gm-${Date.now()}`,
          original_language: 'gl',
          title: { gl: 'Dual GM' },
          content: { gl: '<p>Dual GM</p>' },
          status: 'in_review',
          type: 'article',
        })
        .select('id')
        .single();
      expect(dualInsertErr).toBeNull();
      if (dualDraft?.id) createdPubIds.push(dualDraft.id);

      const { error: dualPubErr } = await dualWriterClient.from('publications').insert({
        author_id: dualWriterId,
        slug: `dual-gm-pub-${Date.now()}`,
        original_language: 'gl',
        title: { gl: 'Dual GM Pub' },
        content: { gl: '<p>Dual GM Pub</p>' },
        status: 'published',
        type: 'article',
      });
      expect(dualPubErr?.code).toBe('42501');

      // Overlapping founder + admin can direct-publish pinned article and delete another author's published article
      const { data: faPub, error: faInsertErr } = await founderAdminClient
        .from('publications')
        .insert({
          author_id: founderAdminId,
          slug: `dual-fa-${Date.now()}`,
          original_language: 'gl',
          title: { gl: 'Founder Admin' },
          content: { gl: '<p>FA</p>' },
          status: 'published',
          is_pinned: true,
          type: 'article',
        })
        .select('id, is_pinned')
        .single();
      expect(faInsertErr).toBeNull();
      expect(faPub?.is_pinned).toBe(true);
      if (faPub?.id) createdPubIds.push(faPub.id);

      const { data: deletedMemberPub, error: faDelErr } = await founderAdminClient
        .from('publications')
        .delete()
        .eq('id', memberPublished.id)
        .select('id');
      expect(faDelErr).toBeNull();
      expect(deletedMemberPub?.length).toBe(1);
    });

    it('enforces publication_tags RLS across update_own, publish, review, update_any, pin-only, and zero-role', async () => {
      const reviewRole = await createCustomRole('test_pt_review', ['publications:review']);
      const publishRole = await createCustomRole('test_pt_publish', ['publications:publish']);
      const pinRole = await createCustomRole('test_pt_pin', ['publications:pin']);
      const updateAnyRole = await createCustomRole('test_pt_any', ['publications:update_any']);

      const { client: memberClient, user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const { client: reviewClient } = await createUserWithRoles('pt-rev', [reviewRole]);
      const { userId: pubUserId, client: publishClient } = await createUserWithRoles('pt-pub', [publishRole]);
      const { client: pinClient } = await createUserWithRoles('pt-pin', [pinRole]);
      const { client: anyClient } = await createUserWithRoles('pt-any', [updateAnyRole]);
      const { client: zeroClient } = await createUserWithRoles('pt-zero', []);

      const { data: tag } = await serviceClient
        .from('tags')
        .insert({ slug: `rls-pt-tag-${Date.now()}` })
        .select('id')
        .single();
      createdTagIds.push(tag!.id);

      const memberDraft = await seedPublication(memberUser.id, 'draft');
      const memberInReview = await seedPublication(memberUser.id, 'in_review');
      const memberPublished = await seedPublication(memberUser.id, 'published');
      const ownPublished = await seedPublication(pubUserId, 'published');

      // Member (publications:update_own) CAN insert/delete on own draft, DENIED on own published
      const { error: ownDraftAddErr } = await memberClient
        .from('publication_tags')
        .insert({ publication_id: memberDraft.id, tag_id: tag!.id });
      expect(ownDraftAddErr).toBeNull();

      const { data: ownDraftDel, error: ownDraftDelErr } = await memberClient
        .from('publication_tags')
        .delete()
        .eq('publication_id', memberDraft.id)
        .eq('tag_id', tag!.id)
        .select('publication_id');
      expect(ownDraftDelErr).toBeNull();
      expect(ownDraftDel?.length).toBe(1);

      const { error: ownPubAddErr } = await memberClient
        .from('publication_tags')
        .insert({ publication_id: memberPublished.id, tag_id: tag!.id });
      expect(ownPubAddErr?.code).toBe('42501');

      // publications:publish CAN manage tags on own published publication
      const { error: pubOwnAddErr } = await publishClient
        .from('publication_tags')
        .insert({ publication_id: ownPublished.id, tag_id: tag!.id });
      expect(pubOwnAddErr).toBeNull();

      // publications:review CAN manage tags on another's in_review publication, DENIED on draft/published
      const { error: revDraftErr } = await reviewClient
        .from('publication_tags')
        .insert({ publication_id: memberDraft.id, tag_id: tag!.id });
      expect(revDraftErr?.code).toBe('42501');

      const { error: revInRevErr } = await reviewClient
        .from('publication_tags')
        .insert({ publication_id: memberInReview.id, tag_id: tag!.id });
      expect(revInRevErr).toBeNull();

      // publications:update_any CAN attach/remove tags on any publication
      const { error: anyAddErr } = await anyClient
        .from('publication_tags')
        .insert({ publication_id: memberPublished.id, tag_id: tag!.id });
      expect(anyAddErr).toBeNull();

      // Pin-only and zero-role users are denied on publication_tags
      const { data: pinDelRows } = await pinClient
        .from('publication_tags')
        .delete()
        .eq('publication_id', memberPublished.id)
        .eq('tag_id', tag!.id)
        .select('publication_id');
      expect(pinDelRows?.length ?? 0).toBe(0);

      const { error: zeroAddErr } = await zeroClient
        .from('publication_tags')
        .insert({ publication_id: memberDraft.id, tag_id: tag!.id });
      expect(zeroAddErr?.code).toBe('42501');
    });

    it('enforces granular tags:create, tags:update, and tags:delete on tags and tag_translations', async () => {
      const createOnlyRole = await createCustomRole('test_tag_create', ['tags:create']);
      const updateOnlyRole = await createCustomRole('test_tag_update', ['tags:update']);
      const deleteOnlyRole = await createCustomRole('test_tag_delete', ['tags:delete']);

      const { client: creatorClient } = await createUserWithRoles('tag-creator', [createOnlyRole]);
      const { client: updaterClient } = await createUserWithRoles('tag-updater', [updateOnlyRole]);
      const { client: deleterClient } = await createUserWithRoles('tag-deleter', [deleteOnlyRole]);
      const { client: zeroClient } = await createUserWithRoles('tag-zero', []);

      // tags:create CAN insert tag & translation, DENIED update & delete
      const slug = `rls-tag-${Date.now()}`;
      const { data: createdTag, error: tagInsertErr } = await creatorClient
        .from('tags')
        .insert({ slug })
        .select('id, slug')
        .single();
      expect(tagInsertErr).toBeNull();
      createdTagIds.push(createdTag!.id);

      const { error: transInsertErr } = await creatorClient
        .from('tag_translations')
        .insert({ tag_id: createdTag!.id, lang: 'gl', name: 'Etiqueta Proba' });
      expect(transInsertErr).toBeNull();

      const { data: creatorUpd } = await creatorClient
        .from('tags')
        .update({ slug: `${slug}-nope` })
        .eq('id', createdTag!.id)
        .select('id');
      expect(creatorUpd?.length ?? 0).toBe(0);

      const { data: creatorDel } = await creatorClient
        .from('tags')
        .delete()
        .eq('id', createdTag!.id)
        .select('id');
      expect(creatorDel?.length ?? 0).toBe(0);

      // tags:update CAN update tag & translation, DENIED insert & delete
      const { error: updaterInsErr } = await updaterClient
        .from('tags')
        .insert({ slug: `${slug}-ins-denied` });
      expect(updaterInsErr?.code).toBe('42501');

      const { data: updatedTag, error: tagUpdErr } = await updaterClient
        .from('tags')
        .update({ slug: `${slug}-updated` })
        .eq('id', createdTag!.id)
        .select('id, slug')
        .single();
      expect(tagUpdErr).toBeNull();
      expect(updatedTag?.slug).toBe(`${slug}-updated`);

      const { data: updatedTrans, error: transUpdErr } = await updaterClient
        .from('tag_translations')
        .update({ name: 'Etiqueta Actualizada' })
        .eq('tag_id', createdTag!.id)
        .eq('lang', 'gl')
        .select('name')
        .single();
      expect(transUpdErr).toBeNull();
      expect(updatedTrans?.name).toBe('Etiqueta Actualizada');

      const { data: updaterDel } = await updaterClient
        .from('tag_translations')
        .delete()
        .eq('tag_id', createdTag!.id)
        .select('tag_id');
      expect(updaterDel?.length ?? 0).toBe(0);

      // Zero-role denied insert/update/delete
      const { error: zeroInsErr } = await zeroClient.from('tags').insert({ slug: `${slug}-zero` });
      expect(zeroInsErr?.code).toBe('42501');

      // tags:delete CAN delete tag_translations and tags, DENIED insert & update
      const { error: deleterInsErr } = await deleterClient
        .from('tag_translations')
        .insert({ tag_id: createdTag!.id, lang: 'es', name: 'Denied' });
      expect(deleterInsErr?.code).toBe('42501');

      const { data: deletedTrans, error: transDelErr } = await deleterClient
        .from('tag_translations')
        .delete()
        .eq('tag_id', createdTag!.id)
        .eq('lang', 'gl')
        .select('tag_id');
      expect(transDelErr).toBeNull();
      expect(deletedTrans?.length).toBe(1);

      const { data: deletedTag, error: tagDelErr } = await deleterClient
        .from('tags')
        .delete()
        .eq('id', createdTag!.id)
        .select('id');
      expect(tagDelErr).toBeNull();
      expect(deletedTag?.length).toBe(1);
    });

    it('enforces comments RLS for zero-role own CRUD, comments:delete_any, and reviewable SELECT', async () => {
      const commentModRole = await createCustomRole('test_comment_mod', ['comments:delete_any']);
      const reviewRole = await createCustomRole('test_comment_rev', ['publications:review']);

      const { userId: zeroUserId, client: zeroClient } = await createUserWithRoles('cmt-zero', []);
      const { client: readerClient } = await createAuthenticatedClient('lector@cerna.org');
      const { client: modClient } = await createUserWithRoles('cmt-mod', [commentModRole]);
      const { client: revClient } = await createUserWithRoles('cmt-rev', [reviewRole]);
      const { user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');

      const publishedPub = await seedPublication(memberUser.id, 'published');
      const inReviewPub = await seedPublication(memberUser.id, 'in_review');

      // Zero-role user CAN create, update, and delete own comment on published publication
      const { data: ownComment, error: cmtInsErr } = await zeroClient
        .from('comments')
        .insert({
          publication_id: publishedPub.id,
          author_id: zeroUserId,
          content: 'Comentario inicial',
        })
        .select('id, content')
        .single();
      expect(cmtInsErr).toBeNull();

      const { data: ownUpdated, error: cmtUpdErr } = await zeroClient
        .from('comments')
        .update({ content: 'Comentario editado' })
        .eq('id', ownComment!.id)
        .select('id, content')
        .single();
      expect(cmtUpdErr).toBeNull();
      expect(ownUpdated?.content).toBe('Comentario editado');

      // Reader cannot update or delete zero-role user's comment
      const { data: readerUpd } = await readerClient
        .from('comments')
        .update({ content: 'Hijack' })
        .eq('id', ownComment!.id)
        .select('id');
      expect(readerUpd?.length ?? 0).toBe(0);

      const { data: readerDel } = await readerClient
        .from('comments')
        .delete()
        .eq('id', ownComment!.id)
        .select('id');
      expect(readerDel?.length ?? 0).toBe(0);

      // comments:delete_any CANNOT update another's comment, CAN delete another's comment
      const { data: modUpd } = await modClient
        .from('comments')
        .update({ content: 'Mod edit' })
        .eq('id', ownComment!.id)
        .select('id');
      expect(modUpd?.length ?? 0).toBe(0);

      const { data: modDel, error: modDelErr } = await modClient
        .from('comments')
        .delete()
        .eq('id', ownComment!.id)
        .select('id');
      expect(modDelErr).toBeNull();
      expect(modDel?.length).toBe(1);

      // Zero-role user can insert & delete own comment again (verifying own DELETE)
      const { data: ownComment2 } = await zeroClient
        .from('comments')
        .insert({
          publication_id: publishedPub.id,
          author_id: zeroUserId,
          content: 'Para borrar',
        })
        .select('id')
        .single();
      const { data: ownDel, error: ownDelErr } = await zeroClient
        .from('comments')
        .delete()
        .eq('id', ownComment2!.id)
        .select('id');
      expect(ownDelErr).toBeNull();
      expect(ownDel?.length).toBe(1);

      // Authenticated user CANNOT insert comment on in_review publication
      const { error: cmtDraftErr } = await zeroClient.from('comments').insert({
        publication_id: inReviewPub.id,
        author_id: zeroUserId,
        content: 'Non permitido',
      });
      expect(cmtDraftErr?.code).toBe('42501');

      // Seed comment on in_review pub: hidden from zero-role, visible to publications:review
      const { data: hiddenCmt } = await serviceClient
        .from('comments')
        .insert({
          publication_id: inReviewPub.id,
          author_id: zeroUserId,
          content: 'Nota interna',
        })
        .select('id')
        .single();

      const { data: zeroSeen } = await zeroClient
        .from('comments')
        .select('id')
        .eq('id', hiddenCmt!.id);
      expect(zeroSeen).toEqual([]);

      const { data: revSeen } = await revClient
        .from('comments')
        .select('id')
        .eq('id', hiddenCmt!.id);
      expect(revSeen?.map((c) => c.id)).toEqual([hiddenCmt!.id]);
    });
  });
});
