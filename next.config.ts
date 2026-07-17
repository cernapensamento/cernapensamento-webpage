import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: ['cyan-swans-wear.loca.lt', 'loca.lt', '*.loca.lt', '*.trycloudflare.com', 'trycloudflare.com'],
};

export default nextConfig;
