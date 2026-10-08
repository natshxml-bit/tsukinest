// components/Footer.tsx
import Link from "next/link";
import {
  Home,
  Compass,
  TrendingUp,
  Clock,
  Library,
  Newspaper,
  Info,
  Mail,
  Shield,
  FileText,
  AlertTriangle,
  Heart,
  ChevronRight,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/popular", label: "Popular", icon: TrendingUp },
  { href: "/latest", label: "Latest", icon: Clock },
  { href: "/all", label: "All Series", icon: Library },
  { href: "/blog", label: "Blog", icon: Newspaper },
];

const legalLinks = [
  { href: "/about", label: "Tentang Kami", icon: Info },
  { href: "/contact", label: "Hubungi Kami", icon: Mail },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/terms", label: "Terms", icon: FileText },
  { href: "/dmca", label: "DMCA", icon: AlertTriangle },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.05] mt-auto pb-24 md:pb-8">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Brand */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center ring-1 ring-white/10">
              <span className="text-base">🌙</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              TsukiNest
            </h3>
          </div>
          <p className="text-neutral-500 text-xs leading-relaxed">
            Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap dan terupdate setiap hari.
          </p>
        </div>

        {/* 2 Columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Navigasi */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Compass className="w-3 h-3 text-neutral-400" />
              </div>
              <h4 className="text-white font-semibold text-sm tracking-tight">
                Navigasi
              </h4>
            </div>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="group flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors active:scale-95"
                  >
                    <link.icon className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    <span>{link.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Shield className="w-3 h-3 text-neutral-400" />
              </div>
              <h4 className="text-white font-semibold text-sm tracking-tight">
                Legal & Info
              </h4>
            </div>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="group flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors active:scale-95"
                  >
                    <link.icon className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    <span>{link.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/[0.05] mt-8 pt-6 flex flex-col items-center text-center gap-1">
          <p className="text-[11px] text-neutral-600">
            © {new Date().getFullYear()} TsukiNest. All rights reserved.
          </p>
          <p className="text-[10px] text-neutral-700 flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-red-500 fill-red-500" /> untuk pecinta komik Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
