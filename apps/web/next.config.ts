import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // The shared contract is a workspace package published as TypeScript source.
  transpilePackages: ['@gitscope/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'avatars.githubusercontent.com' }],
  },
  turbopack: {
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
