import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // sementara matikan PWA saat build APK
  register: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // Fix TypeScript checker error di Termux ARM64
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.shngm.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kacu.gmbr.pro",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "kacu.gmbr.pro",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
    ],

    formats: ["image/avif", "image/webp"],
  },

  compress: false,

  poweredByHeader: false,

  reactStrictMode: true,

  webpack(config, { dev }) {
    if (!dev) {
      // Termux ARM64 fix
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
      config.cache = false;
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);