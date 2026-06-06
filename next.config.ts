import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cukup bypass TypeScript aja
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://cnest.up.railway.app/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
      {
        protocol: 'http',
        hostname: 'kacu.gmbr.pro',
      },
      {
        protocol: 'https',
        hostname: 'kacu.gmbr.pro',
      },
    ],
  },
};

export default nextConfig;
