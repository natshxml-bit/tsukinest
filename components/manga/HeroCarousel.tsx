"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Star, Play, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { MangaItem } from "@/types/manga";
import { cn } from "@/utils/cn";
import SmartImage from "@/components/ui/SmartImage";
import { formatMangaType } from "@/utils/manga";

type AccentStyle = {
  bg: string;
  text: string;
  [key: string]: string;
};

interface HeroCarouselProps {
  items: MangaItem[];
  accentStyle: AccentStyle;
}

export default function HeroCarousel({ items, accentStyle }: HeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const visible = useMemo(() => items.slice(0, 7), [items]);
  const count = visible.length;

  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    timerRef.current = setInterval(next, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, next]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) setIsPaused(true);
      else if (!isPaused) setIsPaused(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isPaused]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (count === 0) return null;

  const active = visible[idx];
  const genres = active.genres?.slice(0, 3) ?? [];

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[4/3] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.slug}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 z-10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <Link
              href={`/manga/${active.slug}`}
              prefetch={false}
              className="block h-full w-full active:scale-[0.995] transition-transform duration-200"
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#141414]">
                <SmartImage
                  src={active.thumb || "/no-image.png"}
                  alt={active.title}
                  title={active.title}
                  fill
                  className="object-cover duration-500 hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, 400px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Country label + rating — top left */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {formatMangaType(active.type)}
                  </span>
                  {active.rating !== "0" && active.rating !== "?" && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-sm">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {active.rating}
                    </span>
                  )}
                </div>

                {/* HOT / NEW badge — top right */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
                  {active.is_hot && (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[9px] font-bold uppercase tracking-wide">
                      HOT
                    </span>
                  )}
                  {active.is_new && !active.is_hot && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wide">
                      BARU
                    </span>
                  )}
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  {/* Genre chips */}
                  {genres.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {genres.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium backdrop-blur-sm"
                        >
                          {g}
                        </span>
                      ))}
                      {active.genres && active.genres.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-medium">
                          +{active.genres.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <h2 className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 mb-1.5">
                    {active.title}
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-neutral-300 mb-3">
                    {active.latest_chapter && (
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {active.latest_chapter}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-white text-xs font-semibold transition-all shadow-lg",
                        accentStyle.bg
                      )}
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Baca Sekarang
                    </motion.span>
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-sm hover:bg-white/15 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" /> Simpan
                    </motion.span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator only — no arrows */}
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {visible.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              whileHover={{ scale: 1.4 }}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === idx ? cn("w-7", accentStyle.bg) : "w-2 bg-neutral-700/50 hover:bg-neutral-600"
              )}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === idx ? "true" : "false"}
            />
          ))}
        </div>
      )}
    </div>
  );
}