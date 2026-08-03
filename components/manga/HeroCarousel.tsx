"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Star, Bookmark, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

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

const SLIDE_DURATION = 6000;
const KENBURNS_DURATION = SLIDE_DURATION;

export default function HeroCarousel({ items, accentStyle }: HeroCarouselProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);

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

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  if (count === 0) return null;

  const slideVariants = {
    enter: (d: number) => ({ x: d * 90, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d * -90, opacity: 0, scale: 0.96 }),
  };

  return (
    <div
      ref={sectionRef}
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <motion.div
        style={{ y: parallaxY, scale: parallaxScale, opacity: parallaxOpacity }}
        className="relative"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#141414]">
          <AnimatePresence custom={dir} mode="sync">
            {visible.map((item, i) =>
              i === idx ? (
                <motion.div
                  key={item.slug}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 z-10"
                >
                  <Link
                    href={`/manga/${item.slug}`}
                    prefetch={false}
                    className="block h-full w-full active:scale-[0.995] transition-transform duration-200"
                  >
                    <div className="relative h-full w-full overflow-hidden">
                      {/* Parallax image layer — slides slower than foreground */}
                      <motion.div
                        initial={{ x: dir * 60, scale: 1.22 }}
                        animate={{ x: 0, scale: 1 }}
                        transition={{
                          x: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
                          scale: { duration: KENBURNS_DURATION / 1000, ease: "linear" },
                        }}
                        className="absolute inset-0"
                      >
                        <SmartImage
                          src={item.thumb || "/no-image.png"}
                          alt={item.title}
                          title={item.title}
                          fill
                          className="object-cover"
                          priority
                          sizes="(max-width: 768px) 100vw, 400px"
                          unoptimized
                        />
                      </motion.div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                      {/* Top badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.is_hot && (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[9px] font-bold uppercase tracking-wide">
                              HOT
                            </span>
                          )}
                          {item.is_new && !item.is_hot && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wide">
                              BARU
                            </span>
                          )}
                          {item.rating !== "0" && item.rating !== "?" && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-sm">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {item.rating}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium uppercase backdrop-blur-sm">
                          {formatMangaType(item.type)}
                        </span>
                      </div>

                      {/* Foreground content — slides faster for depth */}
                      <motion.div
                        initial={{ x: dir * 120, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute bottom-0 left-0 right-0 p-5 z-10"
                      >
                        {item.genres && item.genres.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            {item.genres.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium backdrop-blur-sm"
                              >
                                {g}
                              </span>
                            ))}
                            {item.genres.length > 2 && (
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-medium">
                                +{item.genres.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        <h2 className="text-white font-bold text-xl sm:text-2xl leading-tight line-clamp-1 mb-1.5">
                          {item.title}
                        </h2>

                        <p className="text-[11px] text-neutral-300/90 line-clamp-1 max-w-[85%] leading-relaxed mb-3">
                          {item.synopsis || "Klik untuk melihat detail dan mulai membaca komik ini."}
                        </p>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-semibold shadow-lg transition-transform hover:brightness-110",
                              accentStyle.bg
                            )}
                          >
                            <Bookmark className="w-3.5 h-3.5" /> {item.latest_chapter}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-white/70 font-medium">
                            Baca sekarang <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Dots */}
        {count > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {visible.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  setDir(i > idx ? 1 : -1);
                  setIdx(i);
                }}
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
      </motion.div>
    </div>
  );
}
