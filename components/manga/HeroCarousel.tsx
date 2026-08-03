"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Flame, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
const MAX_SLIDES = 7;

export default function HeroCarousel({ items, accentStyle }: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const visible = useMemo(() => items.slice(0, MAX_SLIDES), [items]);
  const count = visible.length;
  const activeIdx = count > 0 ? idx % count : 0;

  const go = useCallback(
    (nextIdx: number) => setIdx(((nextIdx % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    timerRef.current = setInterval(() => go(activeIdx + 1), SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, go, activeIdx]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(activeIdx - 1);
      else if (e.key === "ArrowRight") go(activeIdx + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, activeIdx]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? activeIdx + 1 : activeIdx - 1);
    touchStartX.current = null;
  };

  if (count === 0) return null;

  const current = visible[activeIdx];
  const nextItem = count > 1 ? visible[(activeIdx + 1) % count] : null;
  const href = `/manga/${current.slug}`;

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative overflow-hidden rounded-3xl bg-[#141414] ring-1 ring-white/5">
        {/* Backdrop: cover aktif di-blur + di-redup */}
        <div className="absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeIdx}
              initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <SmartImage
                src={current.thumb}
                alt=""
                title={current.title}
                fill
                className="scale-125 object-cover opacity-40 blur-2xl saturate-150"
                unoptimized
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Scrim biar teks kebaca */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/55 to-[#0a0a0b]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b]/75 via-[#0a0a0b]/10 to-[#0a0a0b]/45" />

        {/* Konten */}
        <div className="relative z-10 flex min-h-[250px] items-stretch gap-4 p-4 sm:min-h-[320px] sm:gap-7 sm:p-6">
          {/* Tumpukan cover */}
          <div className="relative aspect-[2/3] w-[36%] max-w-[200px] shrink-0 self-center sm:w-[230px]">
            {nextItem && (
              <div className="absolute inset-y-0 right-[-8%] w-[60%] overflow-hidden rounded-xl bg-[#1c1c1c] shadow-xl ring-1 ring-white/10">
                <SmartImage
                  src={nextItem.thumb}
                  alt=""
                  title={nextItem.title}
                  fill
                  className="object-cover opacity-50"
                  unoptimized
                />
              </div>
            )}

            <AnimatePresence initial={false}>
              <motion.div
                key={activeIdx}
                initial={reduceMotion ? { opacity: 0 } : { x: 18, rotate: 2.5, opacity: 0 }}
                animate={{ x: 0, rotate: 0, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { x: -18, rotate: -2.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Link href={href} prefetch={false} tabIndex={-1} aria-label={current.title} className="block h-full w-full">
                  <SmartImage
                    src={current.thumb}
                    alt={current.title}
                    title={current.title}
                    fill
                    className="rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
                    priority={activeIdx === 0}
                    sizes="(max-width: 768px) 40vw, 230px"
                    unoptimized
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" aria-hidden />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-center gap-1.5">
              {current.is_hot && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white", accentStyle.bg)}>
                  <Flame className="h-2.5 w-2.5" />
                  Hot
                </span>
              )}
              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-300">
                {formatMangaType(current.type)}
              </span>
            </div>

            <Link href={href} className="mt-2 block">
              <h2 className="line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                {current.title}
              </h2>
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-neutral-400">
              {current.rating && current.rating !== "0" && current.rating !== "?" && (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {current.rating}
                </span>
              )}
              {current.latest_chapter && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {current.latest_chapter}
                </span>
              )}
              {current.genres?.slice(0, 2).map((g) => (
                <span key={g} className="text-neutral-500">
                  {g}
                </span>
              ))}
            </div>

            {current.synopsis && (
              <p className="mt-2 hidden max-w-xl line-clamp-2 text-xs leading-relaxed text-neutral-400 sm:block md:text-sm">
                {current.synopsis}
              </p>
            )}

            <div className="mt-3 sm:mt-4">
              <Link
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 sm:text-sm",
                  accentStyle.bg
                )}
              >
                Baca <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Kontrol: rail progress + counter + panah */}
      <div className="mt-3 flex items-center gap-3 px-1">
        <div className="flex flex-1 items-center gap-1" aria-label="Posisi carousel">
          {visible.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === activeIdx}
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => go(i)}
              className="group flex h-5 flex-1 items-center"
            >
              <span
                className={cn(
                  "h-1 w-full overflow-hidden rounded-full transition-colors",
                  i === activeIdx ? "bg-white/15" : "bg-white/10 group-hover:bg-white/20"
                )}
              >
                {i === activeIdx && (
                  <span
                    key={activeIdx}
                    className={cn("block h-full w-full rounded-full", accentStyle.bg)}
                    style={{
                      transformOrigin: "left",
                      animation: reduceMotion ? "none" : `hero-rail ${SLIDE_DURATION}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        <span className="text-[10px] font-bold tabular-nums text-neutral-500">
          {String(activeIdx + 1).padStart(2, "0")}
          <span className="mx-0.5 text-neutral-700">/</span>
          {String(count).padStart(2, "0")}
        </span>

        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => go(activeIdx - 1)}
            aria-label="Slide sebelumnya"
            className="rounded-full border border-white/10 p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-90"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => go(activeIdx + 1)}
            aria-label="Slide berikutnya"
            className="rounded-full border border-white/10 p-1.5 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-90"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
