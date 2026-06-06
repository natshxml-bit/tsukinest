"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// 1. Tambahkan icon Search di import ini 👇
import { Home, Compass, Library, Grid3X3, Search } from "lucide-react"; 
import { useAccent } from "@/lib/accent"; 

export default function BottomNav() {
  const { accent, style: accentStyle } = useAccent(); 
  const pathname = usePathname();

  // 2. Tambahkan "/search" ke allowedPaths agar navbar tetap muncul 👇
  const allowedPaths = ["/", "/explore", "/library", "/all", "/popular", "/latest", "/search"];

  if (!allowedPaths.includes(pathname)) {
    return null;
  }

  // 3. Tambahkan item Search ke dalam navItems 👇
  const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "explore", label: "Explore", icon: Compass, href: "/explore" },
    { id: "search", label: "Search", icon: Search, href: "/search" },
    { id: "library", label: "Library", icon: Library, href: "/library" },
    { id: "all", label: "All Series", icon: Grid3X3, href: "/all" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full active:scale-90 transition-transform"
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${
                  isActive 
                    ? (accent === 'custom' ? 'text-[var(--tsuki-custom-hex)]' : accentStyle.text) 
                    : "text-gray-500"
                }`}
              />
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isActive 
                    ? (accent === 'custom' ? 'text-[var(--tsuki-custom-hex)]' : accentStyle.text) 
                    : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
