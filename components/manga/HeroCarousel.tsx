"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Star, Bookmark, ChevronRight } from "lucide-react";
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

const SLIDE_DURATION = 5000;

export default function HeroCarousel({ items, accentStyle }: HeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const visible = useMemo(() => items.slice(0, 7), [items]);
  const count = visible.length;

  const next = useCallback(() => {
    setDir(1);
    setIdx((i) => (i + 1) % count);
  }, [count]);
  const prev = useCallback(() => {
    setDir(-1);
    setIdx((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    timerRef.current = setInterval(next, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, next]);

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

  // Light crossfade variants (no heavy x-movement)
  const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#141414] shadow-xl">
        <AnimatePresence initial={false}>
          <motion.div
            key={idx}
            variants={fadeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Link
              href={`/manga/${visible[idx].slug}`}
              prefetch={false}
              className="block h-full w-full"
            >
              <div className="relative h-full w-full">
                <SmartImage
                  src={visible[idx].thumb || "/no-image.png"}
                  alt={visible[idx].title}
                  title={visible[idx].title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 600px"
                  unoptimized
                />

                {/* Simplified Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-5">
                  {/* Genres */}
                  {visible[idx].genres && visible[idx].genres.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {visible[idx].genres.slice(0, 2).map((g) => (
                        <span key={g} className="text-[8px] font-bold text-neutral-300 uppercase tracking-tight bg-black/40 px-1.5 py-0.5 rounded">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-white font-bold text-base sm:text-lg md:text-2xl leading-tight line-clamp-1 mb-1">
                    {visible[idx].title}
                  </h2>

                  {/* Synopsis */}
                  {visible[idx].synopsis && (
                    <p className="hidden sm:block text-neutral-300 text-xs md:text-sm leading-relaxed line-clamp-2 mb-2 max-w-2xl">
                      {visible[idx].synopsis}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white text-[9px] font-bold border border-white/5">
                      {formatMangaType(visible[idx].type)}
                    </span>

                    {visible[idx].rating !== "0" && visible[idx].rating !== "?" && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-bold border border-amber-500/20">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {visible[idx].rating}
                      </span>
                    )}

                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 text-neutral-300 text-[9px] font-bold border border-white/5">
                      <Bookmark className="w-2.5 h-2.5" />
                      {visible[idx].latest_chapter}
                    </span>
                  </div>

                  {/* CTA & Dots Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {visible.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          aria-label={`Go to slide ${dotIdx + 1}`}
                          onClick={() => {
                            setDir(dotIdx > idx ? 1 : -1);
                            setIdx(dotIdx);
                          }}
                          className={cn(
                            "h-1 rounded-full transition-all duration-200 cursor-pointer",
                            dotIdx === idx ? cn("w-4", accentStyle.bg) : "w-1 bg-neutral-600 hover:bg-neutral-500"
                          )}
                        />
                      ))}
                    </div>

                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[10px] font-bold", accentStyle.bg)}>
                      Baca <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
