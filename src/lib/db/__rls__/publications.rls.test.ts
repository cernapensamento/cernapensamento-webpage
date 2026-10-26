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
});
