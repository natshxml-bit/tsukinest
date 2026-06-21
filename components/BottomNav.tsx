"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Grid3X3, Search } from "lucide-react";
import { useAccent } from "@/lib/accent";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function BottomNav() {
  const { accent, style: accentStyle } = useAccent();
  const pathname = usePathname();

  const allowedPaths = ["/", "/explore", "/library", "/all", "/popular", "/latest", "/search"];

  // Improved routing logic: Highlights parent paths if you are on a sub-route (e.g. /explore/trending highlights Explore)
  const isAllowed = allowedPaths.some((path) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isAllowed) {
    return null;
  }

  const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "explore", label: "Explore", icon: Compass, href: "/explore" },
    { id: "search", label: "Search", icon: Search, href: "/search" },
    { id: "library", label: "Library", icon: Library, href: "/library" },
    { id: "all", label: "All Series", icon: Grid3X3, href: "/all" },
  ];

  return (
    // Wrapper prevents transparent margins from blocking clicks on underlying content
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-4 pointer-events-auto">
        {/* Floating Glass Container */}
        <div className="relative flex items-center bg-black/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-1.5 shadow-2xl shadow-black/80">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 rounded-xl transition-all duration-300 active:scale-95 group",                  isActive ? "text-white" : "text-neutral-500"
                )}
              >
                {/* Active Background Glow */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl transition-all duration-500 ease-out",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl opacity-10",
                      accent === "custom" ? "bg-[var(--tsuki-custom-hex)]" : accentStyle.bg
                    )}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl blur-md opacity-20",
                      accent === "custom" ? "bg-[var(--tsuki-custom-hex)]" : accentStyle.bg
                    )}
                  />
                </div>

                <item.icon
                  className={cn(
                    "relative z-10 w-5 h-5 transition-all duration-300",
                    isActive
                      ? accent === "custom"
                        ? "text-[var(--tsuki-custom-hex)] drop-shadow-[0_0_8px_var(--tsuki-custom-hex)]"
                        : cn(accentStyle.text, "drop-shadow-[0_0_8px_currentColor]")
                      : "group-hover:scale-110 group-hover:text-neutral-300"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />

                <span
                  className={cn(
                    "relative z-10 text-[11px] font-medium tracking-wide transition-colors duration-300 whitespace-nowrap",
                    isActive
                      ? accent === "custom"
                        ? "text-[var(--tsuki-custom-hex)]"
                        : accentStyle.text
                      : "group-hover:text-neutral-300"
                  )}
                >
                  {item.label}
                </span>

                {/* Active Indicator Dot */}                <div
                  className={cn(
                    "absolute -bottom-0.5 w-1 h-1 rounded-full transition-all duration-300",
                    isActive
                      ? cn(
                          "opacity-100 scale-100",
                          accent === "custom" ? "bg-[var(--tsuki-custom-hex)]" : accentStyle.bg
                        )
                      : "opacity-0 scale-0"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Safe area padding for mobile devices with notches/home indicators */}
      <div className="h-[env(safe-area-inset-bottom)] bg-black/60 backdrop-blur-2xl pointer-events-none" />
    </nav>
  );
}