import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockApiLimit = vi.fn();
const mockGlobalLimit = vi.fn();

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@upstash/ratelimit', () => {
  const Ratelimit = vi.fn().mockImplementation((config: { prefix?: string }) => ({
    limit: config.prefix === '@upstash/ratelimit/api' ? mockApiLimit : mockGlobalLimit,
  }));
  (Ratelimit as unknown as { slidingWindow: ReturnType<typeof vi.fn> }).slidingWindow = vi.fn();
  return { Ratelimit };
});

vi.mock('@/lib/agent/markdown', () => ({
  handleMarkdownNegotiation: vi.fn().mockReturnValue(null),
}));

describe('Edge proxy rate limiting', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    mockApiLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 1000 });
    mockGlobalLimit.mockResolvedValue({ success: true, limit: 30, remaining: 29, reset: 1000 });
  });

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('routes POST /api/storage/upload through the 30 req/min mutation limiter instead of the 10 req/min API limiter', async () => {
    const { proxy } = await import('./proxy');
    const req = new NextRequest('http://localhost:3000/api/storage/upload', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });

    const res = await proxy(req);
    expect(res.status).not.toBe(429);
    expect(mockGlobalLimit).toHaveBeenCalledWith('1.2.3.4');
    expect(mockApiLimit).not.toHaveBeenCalled();
  });

  it('still routes other /api/* endpoints through the 10 req/min API limiter', async () => {
    const { proxy } = await import('./proxy');
    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: { 'x-forwarded-for': '5.6.7.8' },
    });

    await proxy(req);
    expect(mockApiLimit).toHaveBeenCalledWith('5.6.7.8');
    expect(mockGlobalLimit).not.toHaveBeenCalled();
  });
});
