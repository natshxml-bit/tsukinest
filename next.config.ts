import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 🔥 Bikin nama unik biar GA BENTROK sama folder lokal
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
