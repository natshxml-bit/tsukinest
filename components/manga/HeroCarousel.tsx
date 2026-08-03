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
    enter: (d: number) => ({ x: d * 100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -100, opacity: 0 }),
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
        <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[#0a0a0a] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
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
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                        initial={{ x: dir * 50, scale: 1.22 }}
                        animate={{ x: 0, scale: 1 }}
                        transition={{
                          x: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] },
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
                          sizes="(max-width: 768px) 100vw, 500px"
                          unoptimized
                        />
                      </motion.div>

                      {/* Cinematic Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/30 to-transparent" />

                      {/* Glassmorphic Floating Card */}
                      <motion.div
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.65, delay: 0.1, ease: [0.21, 1.02, 0.43, 1.01] }}
                        className="absolute bottom-4 left-4 right-4 z-20"
                      >
                        <div className="bg-[#0f0f0f]/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]">
                          {/* Genres above title */}
                          {item.genres && item.genres.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              {item.genres.slice(0, 2).map((g) => (
                                <span
                                  key={g}
                                  className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Title */}
                          <h2 className="text-white font-extrabold text-lg sm:text-xl md:text-2xl leading-tight line-clamp-1 mb-2 tracking-tight">
                            {item.title}
                          </h2>

                          {/* Metadata Row: Rating, Chapter, Type label */}
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {/* Type badge */}
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-wide border border-white/10 backdrop-blur-md flex items-center gap-1">
                              {formatMangaType(item.type)}
                            </span>

                            {/* Rating */}
                            {item.rating !== "0" && item.rating !== "?" && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 backdrop-blur-md">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {item.rating}
                              </span>
                            )}

                            {/* Chapter */}
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-neutral-200 text-[10px] font-bold border border-white/5 backdrop-blur-md">
                              <Bookmark className="w-3 h-3 text-neutral-300" />
                              {item.latest_chapter}
                            </span>

                            {/* Hot/New Badge */}
                            {item.is_hot && (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-extrabold uppercase tracking-wider border border-red-500/30 backdrop-blur-md">
                                HOT
                              </span>
                            )}
                            {item.is_new && !item.is_hot && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider border border-emerald-500/30 backdrop-blur-md">
                                BARU
                              </span>
                            )}
                          </div>

                          {/* Synopsis */}
                          <p className="text-[11px] text-neutral-300/80 line-clamp-2 leading-relaxed mb-4">
                            {item.synopsis || "Klik untuk melihat detail dan mulai membaca komik ini."}
                          </p>

                          {/* Bottom Action Row with Slide Dots & CTA */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                            {/* Navigation Dots inside the Card */}
                            <div className="flex items-center gap-1">
                              {count > 1 && (
                                <div className="flex gap-1.5">
                                  {visible.map((_, dotIdx) => (
                                    <button
                                      key={dotIdx}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDir(dotIdx > idx ? 1 : -1);
                                        setIdx(dotIdx);
                                      }}
                                      className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        dotIdx === idx ? cn("w-5", accentStyle.bg) : "w-1.5 bg-neutral-600/60 hover:bg-neutral-500"
                                      )}
                                      aria-label={`Slide ${dotIdx + 1}`}
                                      aria-current={dotIdx === idx ? "true" : "false"}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* CTA button indicator */}
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-[11px] font-bold shadow-lg transition-transform active:scale-95 hover:brightness-110",
                                accentStyle.bg
                              )}
                            >
                              Baca Sekarang <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
