import { describe, it, expect } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const isDbTestEnabled = process.env.RUN_DB_TESTS === '1';

// Minimal valid 1x1 WebP image bytes (RIFF...WEBP...)
const TINY_WEBP = Buffer.from(
  'UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
  'base64'
);

describe.skipIf(!isDbTestEnabled)('Storage RLS Integration Tests (Local Supabase)', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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

  async function uploadWebp(
    client: SupabaseClient,
    path: string,
    options: { bucket?: string; upsert?: boolean } = {}
  ) {
    const bucket = options.bucket ?? 'media';
    return client.storage.from(bucket).upload(path, TINY_WEBP, {
      contentType: 'image/webp',
      upsert: options.upsert ?? false,
    });
  }

  async function removeAndVerifyDeleted(
    client: SupabaseClient,
    path: string,
    bucket = 'media'
  ): Promise<boolean> {
    const { data, error } = await client.storage.from(bucket).remove([path]);
    if (error) return false;
    return Array.isArray(data) && data.length === 1;
  }

  describe('users/{userId}/* policies', () => {
    it('allows reader, guest, and member to insert, update, and delete under their own users/{userId}/ folder', async () => {
      const emails = [
        'lector@cerna.org',
        'lucia.vazquez@cerna.org',
        'martino.rodriguez@cerna.org',
      ];

      for (const email of emails) {
        const { client, user } = await createAuthenticatedClient(email);
        const path = `users/${user.id}/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;

        const insertRes = await uploadWebp(client, path);
        expect(insertRes.error, `${email} should insert own avatar`).toBeNull();

        const updateRes = await uploadWebp(client, path, { upsert: true });
        expect(updateRes.error, `${email} should update own avatar`).toBeNull();

        const deleted = await removeAndVerifyDeleted(client, path);
        expect(deleted, `${email} should delete own avatar`).toBe(true);
      }
    });

    it('denies non-operators from inserting, updating, or deleting another users avatar', async () => {
      const { user: targetUser } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');
      const { client: memberClient } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const { client: readerClient } = await createAuthenticatedClient('lector@cerna.org');

      const existingPath = `users/${targetUser.id}/avatar-existing-${Date.now()}.webp`;
      const newPath = `users/${targetUser.id}/avatar-hijack-${Date.now()}.webp`;

      await uploadWebp(adminClient, existingPath);

      try {
        for (const client of [memberClient, readerClient]) {
          const insertRes = await uploadWebp(client, newPath);
          expect(insertRes.error).not.toBeNull();

          const updateRes = await uploadWebp(client, existingPath, { upsert: true });
          expect(updateRes.error).not.toBeNull();

          const deleted = await removeAndVerifyDeleted(client, existingPath);
          expect(deleted).toBe(false);
        }
      } finally {
        await adminClient.storage.from('media').remove([existingPath, newPath]);
      }
    });

    it('allows founder and admin operators to insert, update, and delete another users avatar', async () => {
      const { user: readerUser } = await createAuthenticatedClient('lector@cerna.org');
      const operators = ['diegoaraujo@cernapensamento.org', 'admin@cernapensamento.org'];

      for (const email of operators) {
        const { client } = await createAuthenticatedClient(email);
        const path = `users/${readerUser.id}/avatar-op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;

        const insertRes = await uploadWebp(client, path);
        expect(insertRes.error, `${email} should insert other user avatar`).toBeNull();

        const updateRes = await uploadWebp(client, path, { upsert: true });
        expect(updateRes.error, `${email} should update other user avatar`).toBeNull();

        const deleted = await removeAndVerifyDeleted(client, path);
        expect(deleted, `${email} should delete other user avatar`).toBe(true);
      }
    });
  });

  describe('publications/{publicationId}/* policies', () => {
    it('allows guest and member to insert, update, and delete assets of their own draft publication', async () => {
      // Create a fresh ephemeral guest user so we are not constrained by seeded guest quota
      const guestEmail = `rls-guest-${Date.now()}@cerna.org`;
      const { data: createdGuest, error: createGuestErr } = await adminClient.auth.admin.createUser({
        email: guestEmail,
        password: 'Password123!',
        email_confirm: true,
      });
      expect(createGuestErr).toBeNull();
      const guestUserId = createdGuest.user!.id;

      await adminClient.from('users').update({ role: 'guest' }).eq('id', guestUserId);

      const writers = [guestEmail, 'martino.rodriguez@cerna.org'];

      try {
        for (const email of writers) {
          const { client, user } = await createAuthenticatedClient(email);

          const { data: draftPub, error: pubErr } = await adminClient
            .from('publications')
            .insert({
              author_id: user.id,
              slug: `rls-storage-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: { gl: 'Borrador', es: 'Borrador' },
              content: { gl: '<p>c</p>', es: '<p>c</p>' },
              status: 'draft',
              type: 'article',
            })
            .select('id')
            .single();

          expect(pubErr).toBeNull();
          const pubId = draftPub!.id;
          const coverPath = `publications/${pubId}/cover-${Date.now()}.webp`;
          const inlinePath = `publications/${pubId}/inline/fig-${Date.now()}.webp`;

          try {
            for (const path of [coverPath, inlinePath]) {
              const insertRes = await uploadWebp(client, path);
              expect(insertRes.error, `${email} should insert ${path}`).toBeNull();

              const updateRes = await uploadWebp(client, path, { upsert: true });
              expect(updateRes.error, `${email} should update ${path}`).toBeNull();

              const deleted = await removeAndVerifyDeleted(client, path);
              expect(deleted, `${email} should delete ${path}`).toBe(true);
            }
          } finally {
            await adminClient.storage.from('media').remove([coverPath, inlinePath]);
            await adminClient.from('publications').delete().eq('id', pubId);
          }
        }
      } finally {
        await adminClient.auth.admin.deleteUser(guestUserId);
      }
    });

    it('denies reader from inserting into publications/{publicationId}/* even if they own a draft row', async () => {
      const { client: readerClient, user: readerUser } = await createAuthenticatedClient('lector@cerna.org');
      const { data: readerDraft } = await adminClient
        .from('publications')
        .insert({
          author_id: readerUser.id,
          slug: `rls-storage-reader-${Date.now()}`,
          title: { gl: 'Lector', es: 'Lector' },
          content: { gl: '<p>c</p>', es: '<p>c</p>' },
          status: 'draft',
          type: 'article',
        })
        .select('id')
        .single();

      const path = `publications/${readerDraft!.id}/cover-${Date.now()}.webp`;
      try {
        const insertRes = await uploadWebp(readerClient, path);
        expect(insertRes.error).not.toBeNull();
      } finally {
        await adminClient.storage.from('media').remove([path]);
        await adminClient.from('publications').delete().eq('id', readerDraft!.id);
      }
    });

    it('denies non-operator writers from updating or deleting assets of their own published publication', async () => {
      const { client: memberClient, user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const { data: pub } = await adminClient
        .from('publications')
        .insert({
          author_id: memberUser.id,
          slug: `rls-storage-published-${Date.now()}`,
          title: { gl: 'Publicado', es: 'Publicado' },
          content: { gl: '<p>c</p>', es: '<p>c</p>' },
          status: 'published',
          type: 'article',
        })
        .select('id')
        .single();

      const path = `publications/${pub!.id}/cover-${Date.now()}.webp`;
      await uploadWebp(adminClient, path);

      try {
        const updateRes = await uploadWebp(memberClient, path, { upsert: true });
        expect(updateRes.error).not.toBeNull();

        const deleted = await removeAndVerifyDeleted(memberClient, path);
        expect(deleted).toBe(false);
      } finally {
        await adminClient.storage.from('media').remove([path]);
        await adminClient.from('publications').delete().eq('id', pub!.id);
      }
    });

    it('denies a writer from inserting into another authors publication folder', async () => {
      const { client: memberClient } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const { user: founderUser } = await createAuthenticatedClient('diegoaraujo@cernapensamento.org');

      const { data: founderDraft } = await adminClient
        .from('publications')
        .insert({
          author_id: founderUser.id,
          slug: `rls-storage-other-${Date.now()}`,
          title: { gl: 'Outro', es: 'Otro' },
          content: { gl: '<p>c</p>', es: '<p>c</p>' },
          status: 'draft',
          type: 'article',
        })
        .select('id')
        .single();

      const path = `publications/${founderDraft!.id}/cover-${Date.now()}.webp`;
      try {
        const insertRes = await uploadWebp(memberClient, path);
        expect(insertRes.error).not.toBeNull();
      } finally {
        await adminClient.storage.from('media').remove([path]);
        await adminClient.from('publications').delete().eq('id', founderDraft!.id);
      }
    });

    it('allows founder and admin operators to insert, update, and delete assets of another authors published publication', async () => {
      const { user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const { data: memberPub } = await adminClient
        .from('publications')
        .insert({
          author_id: memberUser.id,
          slug: `rls-storage-op-pub-${Date.now()}`,
          title: { gl: 'Publicado Membro', es: 'Publicado Miembro' },
          content: { gl: '<p>c</p>', es: '<p>c</p>' },
          status: 'published',
          type: 'article',
        })
        .select('id')
        .single();

      const operators = ['diegoaraujo@cernapensamento.org', 'admin@cernapensamento.org'];

      try {
        for (const email of operators) {
          const { client } = await createAuthenticatedClient(email);
          const path = `publications/${memberPub!.id}/inline/op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;

          const insertRes = await uploadWebp(client, path);
          expect(insertRes.error, `${email} should insert into other published pub`).toBeNull();

          const updateRes = await uploadWebp(client, path, { upsert: true });
          expect(updateRes.error, `${email} should update other published pub`).toBeNull();

          const deleted = await removeAndVerifyDeleted(client, path);
          expect(deleted, `${email} should delete from other published pub`).toBe(true);
        }
      } finally {
        await adminClient.from('publications').delete().eq('id', memberPub!.id);
      }
    });
  });

  describe('_orphans/* policies and public SELECT', () => {
    it('restricts _orphans/* INSERT, UPDATE, and DELETE strictly to operators while allowing public SELECT', async () => {
      const orphanPath = `_orphans/media/test-orphan-${Date.now()}.webp`;
      const nonOperators = [
        'lector@cerna.org',
        'lucia.vazquez@cerna.org',
        'martino.rodriguez@cerna.org',
      ];
      const operators = ['diegoaraujo@cernapensamento.org', 'admin@cernapensamento.org'];

      try {
        // Non-operators cannot insert into _orphans/*
        for (const email of nonOperators) {
          const { client } = await createAuthenticatedClient(email);
          const insertRes = await uploadWebp(client, orphanPath);
          expect(insertRes.error, `${email} must be denied INSERT in _orphans`).not.toBeNull();
        }

        // Founder can insert, update, and delete in _orphans/*
        const { client: founderClient } = await createAuthenticatedClient(operators[0]);
        const insertRes = await uploadWebp(founderClient, orphanPath);
        expect(insertRes.error).toBeNull();

        // Public anonymous client can SELECT (download) from media
        const anonClient = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const downloadRes = await anonClient.storage.from('media').download(orphanPath);
        expect(downloadRes.error).toBeNull();

        // Non-operators cannot update or delete existing _orphans/* object
        for (const email of nonOperators) {
          const { client } = await createAuthenticatedClient(email);
          const updateRes = await uploadWebp(client, orphanPath, { upsert: true });
          expect(updateRes.error, `${email} must be denied UPDATE in _orphans`).not.toBeNull();

          const deleted = await removeAndVerifyDeleted(client, orphanPath);
          expect(deleted, `${email} must be denied DELETE in _orphans`).toBe(false);
        }

        // Admin operator can update and delete in _orphans/*
        const { client: adminOpClient } = await createAuthenticatedClient(operators[1]);
        const adminUpdate = await uploadWebp(adminOpClient, orphanPath, { upsert: true });
        expect(adminUpdate.error).toBeNull();

        const adminDeleted = await removeAndVerifyDeleted(adminOpClient, orphanPath);
        expect(adminDeleted).toBe(true);
      } finally {
        await adminClient.storage.from('media').remove([orphanPath]);
      }
    });
  });

  describe('WebP-only bucket enforcement and legacy path rejection', () => {
    it('rejects non-WebP uploads (image/jpeg, image/png) to media at the bucket level', async () => {
      const { client: memberClient, user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const jpegPath = `users/${memberUser.id}/avatar-jpeg-${Date.now()}.jpg`;
      const pngPath = `users/${memberUser.id}/avatar-png-${Date.now()}.png`;

      try {
        const jpegRes = await memberClient.storage
          .from('media')
          .upload(jpegPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0]), {
            contentType: 'image/jpeg',
          });
        expect(jpegRes.error, 'image/jpeg must be rejected by media bucket').not.toBeNull();

        const pngRes = await memberClient.storage
          .from('media')
          .upload(pngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
            contentType: 'image/png',
          });
        expect(pngRes.error, 'image/png must be rejected by media bucket').not.toBeNull();
      } finally {
        await adminClient.storage.from('media').remove([jpegPath, pngPath]);
      }
    });

    it('rejects legacy profiles/* and publications/covers/* uploads on media after contract phase', async () => {
      const { client: memberClient, user: memberUser } = await createAuthenticatedClient('martino.rodriguez@cerna.org');
      const legacyProfile = `profiles/${memberUser.id}/avatar-legacy-${Date.now()}.webp`;
      const legacyCover = `publications/covers/${memberUser.id}/cover-legacy-${Date.now()}.webp`;

      try {
        const res1 = await uploadWebp(memberClient, legacyProfile);
        expect(res1.error).not.toBeNull();

        const res2 = await uploadWebp(memberClient, legacyCover);
        expect(res2.error).not.toBeNull();
      } finally {
        await adminClient.storage.from('media').remove([legacyProfile, legacyCover]);
      }
    });
  });
});
