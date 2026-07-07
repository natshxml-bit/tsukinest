// config/navigation.config.ts
// Navigation structure for Navbar, BottomNav, sitemap, etc.

export interface NavItem {
  label: string;
  href: string;
  icon?: string; // lucide icon name
  badge?: string;
}

export const MAIN_NAV: NavItem[] = [
  { label: "Beranda", href: "/", icon: "Home" },
  { label: "Terbaru", href: "/latest", icon: "Clock" },
  { label: "Populer", href: "/popular", icon: "TrendingUp" },
  { label: "Jelajahi", href: "/explore", icon: "Compass" },
  { label: "Pustaka", href: "/library", icon: "BookMarked" },
];

export const BOTTOM_NAV: NavItem[] = [
  { label: "Beranda", href: "/", icon: "Home" },
  { label: "Cari", href: "/search", icon: "Search" },
  { label: "Jelajahi", href: "/explore", icon: "Compass" },
  { label: "Koleksi", href: "/library", icon: "BookMarked" },
  { label: "Profil", href: "/profile", icon: "User" },
];

export const FOOTER_LINKS: NavItem[] = [
  { label: "Tentang", href: "/about" },
  { label: "Privasi", href: "/privacy" },
  { label: "Syarat", href: "/terms" },
  { label: "DMCA", href: "/dmca" },
  { label: "Kontak", href: "/contact" },
  { label: "Blog", href: "/blog" },
];
