"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Grid3X3, Search, User, LucideIcon } from "lucide-react";
import { useAccent } from "@/lib/accent";

// Utility for merging Tailwind classes safely
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ----------------------------------------------------------------------
// Types & Config
// ----------------------------------------------------------------------

interface NavItemData {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number | boolean;
}

const NAV_ITEMS: NavItemData[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "explore", label: "Explore", icon: Compass, href: "/explore" }, // <-- badge dihapus
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "library", label: "Library", icon: Library, href: "/library" }, // <-- badge dihapus
  { id: "all", label: "Series", icon: Grid3X3, href: "/all" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

const ALLOWED_PATHS = ["/", "/explore", "/library", "/all", "/popular", "/latest", "/search", "/profile"];

// ----------------------------------------------------------------------
// Memoized Sub-components for Performance
// ----------------------------------------------------------------------

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  accentStyle: { bg: string; text: string };
  isCustomAccent: boolean;
  customHex?: string;
  onClick: () => void;
}

const NavItem = memo(({ item, isActive, accentStyle, isCustomAccent, customHex, onClick }: NavItemProps) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className="relative flex h-[60px] flex-1 flex-col items-center justify-center outline-none select-none group"
      draggable={false}
    >
      {/* Interaction Area 
        Provides a larger touch target for mobile thumbs without expanding the visual footprint
      */}
      <div className="absolute inset-0 -m-2 rounded-2xl touch-manipulation" />

      {/* Icon Container 
        Smooth spring transform up when active 
      */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isActive ? "-translate-y-2 scale-100" : "translate-y-0 scale-95 opacity-60 group-hover:opacity-100 group-hover:scale-100 group-active:scale-90"
        )}
      >
        <div className="relative">
          <Icon
            className={cn(
              "w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300",
              isActive 
                ? "text-white" 
                : "text-neutral-400 group-hover:text-neutral-200"
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
          
          {/* Active Inner Glow on Icon */}
          <Icon
            className={cn(
              "absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 blur-[6px] transition-opacity duration-300 pointer-events-none",
              isActive ? "opacity-60" : "opacity-0",
              isCustomAccent ? "" : accentStyle.text
            )}
            style={isCustomAccent ? { color: customHex } : undefined}
            strokeWidth={3}
          />

          {/* Premium Notification Badge */}
          {item.badge && (
            <div 
              className={cn(
                "absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border-[1.5px] border-[#0A0A0B] bg-red-500 px-1 text-[8px] font-bold text-white shadow-sm transition-transform duration-300",
                isActive ? "scale-100" : "scale-90 group-hover:scale-100"
              )}
            >
              {typeof item.badge === 'number' ? item.badge : ''}
            </div>
          )}
        </div>
      </div>

      {/* Label Container 
        Smooth fade and slide up when active 
      */}
      <span
        className={cn(
          "absolute bottom-2 z-10 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap",
          isActive 
            ? "translate-y-0 opacity-100 scale-100" 
            : "translate-y-2 opacity-0 scale-90"
        )}
        style={isActive && isCustomAccent ? { color: customHex } : undefined}
      >
        <span className={cn(!isCustomAccent && isActive ? accentStyle.text : "")}>
          {item.label}
        </span>
      </span>
    </Link>
  );
});

NavItem.displayName = "NavItem";

// ----------------------------------------------------------------------
// Main Navigation Component
// ----------------------------------------------------------------------

export default function BottomNav() {
  const { accent, style: accentStyle } = useAccent();
  const pathname = usePathname();
  
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Highly optimized scroll listener using requestAnimationFrame
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          // Scroll Down -> Hide
          if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
            setIsVisible(false);
          } 
          // Scroll Up -> Show
          else if (currentScrollY < lastScrollY.current) {
            setIsVisible(true);
          }

          // Auto-reveal if hit the absolute bottom
          if (windowHeight + currentScrollY >= documentHeight - 20) {
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute Active State
  const activeIndex = useMemo(() => {
    if (!pathname) return -1;
    return NAV_ITEMS.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    );
  }, [pathname]);

  const isAllowed = useMemo(() => {
    if (!pathname) return false;
    return ALLOWED_PATHS.some((path) =>
      path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)
    );
  }, [pathname]);

  if (!isAllowed) return null;

  // Render variables
  const isCustomAccent = accent === "custom";
  const customHex = "var(--tsuki-custom-hex)";
  const ITEM_PERCENTAGE = 100 / NAV_ITEMS.length;

  // Haptic feedback simulator (visual/native web)
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40); // Light tap
    }
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]",
        // Smooth GPU accelerated hide/reveal
        "transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform",
        isVisible ? "translate-y-0" : "translate-y-[150%]",
        // Hide initial mount flash
        !isMounted && "opacity-0"
      )}
      aria-label="Bottom Navigation"
    >
      <div className="mx-auto max-w-[28rem] px-3 sm:px-4 pb-4 pt-2 pointer-events-auto">
        {/* Main Glassmorphic Floating Dock
          Utilizes layered shadows, border highlights, and backdrop blurs
          for a deep, premium Next-gen OS feel.
        */}
        <div className="relative flex items-center bg-[#0A0A0B]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[1.5rem] p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.02)_inset] overflow-hidden">
          
          {/* Ambient Inner Noise / Texture / Soft Light */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-[1.5rem]" />

          {/* Dynamic Render Container for the sliding indicator to match flex-1 perfectly */}
          <div className="relative flex w-full justify-between items-center z-10">
            
            {/* Animated Sliding Pill (The Active Indicator Background)
              Uses mathematical percentages based on item count so it never breaks
              even if you add/remove more items.
            */}
            {activeIndex !== -1 && (
              <div
                className="absolute left-0 top-0 bottom-0 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform z-0"
                style={{ 
                  width: `${ITEM_PERCENTAGE}%`,
                  transform: `translateX(${activeIndex * 100}%)` 
                }}
              >
                {/* Pill Inner Box - slightly padded to fit behind the icon beautifully */}
                <div className="absolute inset-x-1 inset-y-0 rounded-xl">
                  {/* Pill Base - Frosted Tint */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-xl opacity-[0.18] mix-blend-screen",
                      !isCustomAccent ? accentStyle.bg : ""
                    )}
                    style={isCustomAccent ? { backgroundColor: customHex } : undefined}
                  />
                  
                  {/* Layered Glows for Depth */}
                  <div 
                    className={cn(
                      "absolute -inset-2 rounded-xl opacity-20 blur-xl",
                      !isCustomAccent ? accentStyle.bg : ""
                    )}
                    style={isCustomAccent ? { backgroundColor: customHex } : undefined}
                  />

                  {/* Top/Bottom Edge Highlighting for Glass effect */}
                  <div className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  {/* Animated Indicator Dot / Line (Arc Browser style) */}
                  <div 
                    className={cn(
                      "absolute -bottom-1.5 left-1/2 w-6 h-[3px] -translate-x-1/2 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]",
                      !isCustomAccent ? accentStyle.bg : ""
                    )}
                    style={isCustomAccent ? { backgroundColor: customHex } : undefined}
                  />
                </div>
              </div>
            )}

            {/* Render Nav Items */}
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeIndex !== -1 && NAV_ITEMS[activeIndex].id === item.id}
                accentStyle={accentStyle}
                isCustomAccent={isCustomAccent}
                customHex={customHex}
                onClick={triggerHaptic}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
