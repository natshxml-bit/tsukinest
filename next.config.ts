import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Saklar khusus build APK di Termux (HP Android).
// Aktifkan HANYA saat build manual di Termux, misalnya:
//   TERMUX_BUILD=1 npm run build
// Kalau tidak di-set (misalnya di Vercel/production), nilainya "false"
// dan semua workaround Termux di bawah otomatis tidak aktif.
const isTermuxBuild = process.env.TERMUX_BUILD === "1";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // sementara matikan PWA saat build APK
  register: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  typescript: {
    // Cuma "tutup mata" dari TypeScript error saat build APK di Termux.
    // Di production (Vercel dll), error tetap harus ketahuan.
    ignoreBuildErrors: isTermuxBuild,
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

  // Kompresi otomatis Next.js: nyala normal di production,
  // hanya dimatikan saat build APK di Termux.
  compress: !isTermuxBuild,

  poweredByHeader: false,

  reactStrictMode: true,

  webpack(config, { dev }) {
    if (!dev && isTermuxBuild) {
      // Termux ARM64 fix — device HP sering gak kuat proses minify
      // yang berat, jadi khusus build APK di Termux ini dimatikan.
      // Di production build biasa (Vercel dll), bagian ini dilewati
      // sehingga minify tetap jalan normal.
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