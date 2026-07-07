import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.TERMUX_BUILD === "true",
  register: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
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

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Termux build fix
  webpack(config, { dev }) {
    if (!dev) {
      // matikan terser/minify yang crash di Termux
      config.optimization.minimize = false;

      // matikan cache webpack
      config.cache = false;
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);