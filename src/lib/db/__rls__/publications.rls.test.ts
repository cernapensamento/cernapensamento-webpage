import { describe, it, expect } from 'vitest';
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
      .select('id, full_name, slug, bio, avatar_url, role')
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
});
