import fs from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const cwd = process.cwd();
const isWorktree = cwd.includes(`${path.sep}.worktrees${path.sep}`);
const repoRoot = isWorktree ? path.resolve(cwd, '../..') : cwd;

if (isWorktree) {
  for (const file of fs.readdirSync(repoRoot)) {
    if (!file.startsWith('.env') || file === '.env.example') continue;
    const localEnv = path.join(cwd, file);
    if (!fs.existsSync(localEnv)) {
      try {
        fs.symlinkSync(path.join('../..', file), localEnv);
      } catch {
        // Ignore if symlink already exists
      }
    }
  }
  loadEnvConfig(repoRoot);
}

const httpsRemoteHosts = [
  '*.supabase.co',
  'lh3.googleusercontent.com',
];

const httpLocalHosts = ['127.0.0.1', 'localhost'];

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      ...httpsRemoteHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
      ...httpLocalHosts.map((hostname) => ({ protocol: 'http' as const, hostname })),
    ],
  },
  allowedDevOrigins: ['loca.lt', '*.loca.lt', '*.trycloudflare.com', 'trycloudflare.com'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Vary',
            value: 'Accept',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "cerna-pensamento",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    automaticVercelMonitors: true,

    // Tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
