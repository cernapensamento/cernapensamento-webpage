import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import { POST } from './route';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { STORAGE_BUCKET, STORAGE_CACHE_CONTROL } from '@/lib/storage/constants';

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

async function createPngBuffer(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 180, g: 120, b: 60 } },
  })
    .png()
    .toBuffer();
}

async function createJpegBuffer(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 40, g: 90, b: 140 } },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function createWebpBuffer(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 160, b: 80 } },
  })
    .webp({ quality: 80 })
    .toBuffer();
}

function makeUploadRequest(fields: Record<string, string | Blob>, filename = 'photo.png'): Request {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Blob) {
      formData.append(key, value, filename);
    } else {
      formData.append(key, value);
    }
  }
  return new Request('http://localhost:3000/api/storage/upload', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/storage/upload', () => {
  let mockUpload: ReturnType<typeof vi.fn>;
  let mockGetPublicUrl: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
    storage: { from: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpload = vi.fn().mockResolvedValue({ data: { path: 'mocked' }, error: null });
    mockGetPublicUrl = vi.fn((path: string) => ({
      data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/media/${path}` },
    }));
    mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'pub-1', author_id: 'user-1', status: 'draft' },
      error: null,
    });

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: 'user-1' } as never,
      profile: { id: 'user-1', role: 'member' } as never,
      role: 'member',
    });
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      profile: null,
      role: null,
    });

    const buf = await createPngBuffer(100, 100);
    const req = makeUploadRequest({
      file: new Blob([new Uint8Array(buf)], { type: 'image/png' }),
      category: 'profile_avatar',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects reader role uploading publication assets with 403', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: 'reader-1' } as never,
      profile: { id: 'reader-1', role: 'reader' } as never,
      role: 'reader',
    });

    const buf = await createPngBuffer(200, 200);
    const req = makeUploadRequest({
      file: new Blob([new Uint8Array(buf)], { type: 'image/png' }),
      category: 'publication_cover',
      publicationId: 'pub-1',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects non-operator uploading to another user avatar folder with 403', async () => {
    const buf = await createPngBuffer(200, 200);
    const req = makeUploadRequest({
      file: new Blob([new Uint8Array(buf)], { type: 'image/png' }),
      category: 'profile_avatar',
      userId: 'other-user',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects non-operator uploading to another author publication with 403', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'pub-2', author_id: 'other-author', status: 'draft' },
      error: null,
    });

    const buf = await createPngBuffer(200, 200);
    const req = makeUploadRequest({
      file: new Blob([new Uint8Array(buf)], { type: 'image/png' }),
      category: 'publication_cover',
      publicationId: 'pub-2',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects non-operator uploading to a published publication with 403', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'pub-1', author_id: 'user-1', status: 'published' },
      error: null,
    });

    const buf = await createPngBuffer(200, 200);
    const req = makeUploadRequest({
      file: new Blob([new Uint8Array(buf)], { type: 'image/png' }),
      category: 'publication_inline',
      publicationId: 'pub-1',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('allows operator (founder/admin) to upload to another author published publication', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: 'admin-1' } as never,
      profile: { id: 'admin-1', role: 'admin' } as never,
      role: 'admin',
    });
    mockSingle.mockResolvedValue({
      data: { id: 'pub-99', author_id: 'other-author', status: 'published' },
      error: null,
    });

    const buf = await createJpegBuffer(800, 600);
    const req = makeUploadRequest(
      {
        file: new Blob([new Uint8Array(buf)], { type: 'image/jpeg' }),
        category: 'publication_cover',
        publicationId: 'pub-99',
      },
      'cover.jpg'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.path).toMatch(/^publications\/pub-99\/cover-\d+-[a-z0-9]+\.webp$/);
    expect(json.width).toBe(800);
    expect(json.height).toBe(600);
  });

  it('rejects corrupt or non-image payloads with 400', async () => {
    const req = makeUploadRequest(
      {
        file: new Blob(['not-an-image-at-all'], { type: 'image/png' }),
        category: 'profile_avatar',
      },
      'corrupt.png'
    );

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('passes valid in-bounds WebP bytes straight through without re-encoding', async () => {
    const webpBuf = await createWebpBuffer(300, 300);
    const req = makeUploadRequest(
      {
        file: new Blob([new Uint8Array(webpBuf)], { type: 'image/webp' }),
        category: 'profile_avatar',
      },
      'avatar.webp'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.path).toMatch(/^users\/user-1\/avatar-\d+-[a-z0-9]+\.webp$/);
    expect(json.width).toBe(300);
    expect(json.height).toBe(300);

    expect(mockSupabase.storage.from).toHaveBeenCalledWith(STORAGE_BUCKET);
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [uploadedPath, uploadedBuffer, uploadOptions] = mockUpload.mock.calls[0];
    expect(uploadedPath).toBe(json.path);
    expect(Buffer.compare(uploadedBuffer, webpBuf)).toBe(0);
    expect(uploadOptions).toEqual({
      contentType: 'image/webp',
      cacheControl: STORAGE_CACHE_CONTROL,
      upsert: false,
    });
  });

  it('crops small non-square WebP avatars to a square instead of passing through uncropped', async () => {
    const nonSquareWebp = await createWebpBuffer(400, 200);
    const req = makeUploadRequest(
      {
        file: new Blob([new Uint8Array(nonSquareWebp)], { type: 'image/webp' }),
        category: 'profile_avatar',
      },
      'wide-avatar.webp'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.width).toBe(200);
    expect(json.height).toBe(200);

    const [, uploadedBuffer] = mockUpload.mock.calls[0];
    expect(Buffer.compare(uploadedBuffer, nonSquareWebp)).not.toBe(0);
    const meta = await sharp(uploadedBuffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(200);
  });

  it('crops small non-square EXIF-oriented avatars to a square WebP', async () => {
    // 600x200 raw with orientation 6 => 200x600 oriented => targetSide = min(512, 200, 600) = 200
    const rotatedJpeg = await sharp({
      create: { width: 600, height: 200, channels: 3, background: { r: 60, g: 110, b: 170 } },
    })
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 90 })
      .toBuffer();

    const req = makeUploadRequest(
      {
        file: new Blob([new Uint8Array(rotatedJpeg)], { type: 'image/jpeg' }),
        category: 'profile_avatar',
      },
      'rotated-avatar.jpg'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.width).toBe(200);
    expect(json.height).toBe(200);

    const [, uploadedBuffer] = mockUpload.mock.calls[0];
    const meta = await sharp(uploadedBuffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(200);
  });

  it('converts JPEG/PNG to WebP and resizes oversized images without upscaling', async () => {
    // Oversized avatar (1000x800) -> resized to 512x512 cover fit WebP
    const bigPng = await createPngBuffer(1000, 800);
    const req = makeUploadRequest(
      {
        file: new Blob([new Uint8Array(bigPng)], { type: 'image/png' }),
        category: 'profile_avatar',
      },
      'big-avatar.png'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.width).toBe(512);
    expect(json.height).toBe(512);

    const [, uploadedBuffer] = mockUpload.mock.calls[0];
    const meta = await sharp(uploadedBuffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it('does not upscale small PNG images when converting to WebP', async () => {
    const smallPng = await createPngBuffer(120, 90);
    const req = makeUploadRequest(
      {
        file: new Blob([new Uint8Array(smallPng)], { type: 'image/png' }),
        category: 'publication_inline',
        publicationId: 'pub-1',
      },
      'small-chart.png'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.path).toMatch(/^publications\/pub-1\/inline\/small-chart-\d+-[a-z0-9]+\.webp$/);
    expect(json.width).toBe(120);
    expect(json.height).toBe(90);

    const [, uploadedBuffer] = mockUpload.mock.calls[0];
    const meta = await sharp(uploadedBuffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(120);
    expect(meta.height).toBe(90);
  });
});
