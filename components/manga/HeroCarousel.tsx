"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Star, Play, Bookmark } from "lucide-react";

import type { MangaItem } from "@/types/manga";
import { cn } from "@/utils/cn";
import SmartImage from "@/components/ui/SmartImage";

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const visible = items.slice(0, 7);
  if (visible.length === 0) return null;
  const active = visible[idx];

  const next = useCallback(() => setIdx((i) => (i + 1) % visible.length), [visible.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + visible.length) % visible.length), [visible.length]);

  useEffect(() => {
    if (visible.length <= 1 || isPaused) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible.length, isPaused, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Link href={`/manga/${active.slug}`} prefetch={false} className="block w-full active:scale-[0.99] transition-transform duration-200">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#141414]">
          <SmartImage
            src={active.thumb || "/no-image.png"}
            alt={active.title}
            title={active.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-medium uppercase tracking-wide">
                {active.type}
              </span>
              {active.rating !== "0" && active.rating !== "?" && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-bold text-white">{active.rating}</span>
                </div>
              )}
            </div>
            <h2 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">{active.title}</h2>
            <p className="text-xs text-neutral-300 line-clamp-2 max-w-[95%] leading-relaxed mb-3">
              {active.synopsis || "Klik untuk melihat detail komik."}
            </p>
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-semibold", accentStyle.bg)}>
                <Play className="w-3 h-3 fill-white" /> Baca
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white text-xs font-medium">
                <Bookmark className="w-3 h-3" /> Simpan
              </div>
            </div>
          </div>
        </div>
      </Link>

      {visible.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === idx ? cn("w-6", accentStyle.bg) : "w-1 bg-neutral-700"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
