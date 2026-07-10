// config/site.config.ts
// Centralised site-level configuration.

export const SITE_CONFIG = {
  name: "TsukiNest",
  title: "TsukiNest - Baca Manhwa, Manhua & Manga Bahasa Indonesia",
  description:
    "Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap dan terupdate setiap hari.",
  url: "https://tsukinest.my.id",
  ogImage: "/og-image.png",
  locale: "id_ID",
  creator: "@tsukinest",
  /** Google Search Console verification token */
  googleVerification: "tgMxzJ5YEIOEHIEK_BtXsx_R6W99nM0zljfxszvBh5w",
  keywords: [
    "baca manhwa",
    "baca manhua",
    "baca manga",
    "manhwa indonesia",
    "manhua indonesia",
    "manga indonesia",
    "komik asia",
    "webtoon indonesia",
    "tsukinest",
  ],
} as const;

export type SiteConfig = typeof SITE_CONFIG;
