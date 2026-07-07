"use client";

// features/manga/components/RelatedManga.tsx
import Link from "next/link";
import { BookOpen, Star, ChevronRight, Sparkles } from "lucide-react";
import { useAccent } from "@/lib/accent";
import SmartImage from "@/components/ui/SmartImage"; // <-- KITA IMPOR KESINI JUGA
import type { RelatedSeries } from "@/types/manga";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  if (finalUrl.startsWith("http") && !finalUrl.includes("wsrv.nl")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=300&output=webp&q=80`;
  }
  return finalUrl;
}

interface RelatedMangaProps {
  items: RelatedSeries[];
}

export function RelatedManga({ items }: RelatedMangaProps) {
  const { style: accentStyle } = useAccent();

  if (items.length === 0) {
    return (
      <div className="bg-[#141414] border border-white/[0.05] rounded-2xl p-8 text-center border-none">
        <Sparkles className={cn("w-8 h-8 mx-auto mb-3", accentStyle.text)} />
        <h3 className="text-base font-bold text-white mb-1">Tidak Ada Rekomendasi</h3>
        <p className="text-sm text-neutral-600">Seri serupa belum tersedia untuk saat ini</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item, i) => (
        <Link
          key={item.slug || i}
          href={`/manga/${item.slug}`}
          prefetch={false}
          className="group flex gap-3 p-3 rounded-xl bg-[#141414] border border-white/5 hover:bg-[#1c1c1c] active:scale-[0.98] transition"
        >
          <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c]">
            {/* AMAN: Mengganti tag img native ke SmartImage */}
            <SmartImage
              src={cleanThumb(item.thumb || "")}
              alt={item.title}
              title={item.title}
              fill
              className="object-cover"
            />
            {item.type && (
              <span
                className={cn(
                  "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase z-10",
                  accentStyle.bg
                )}
              >
                {item.type}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 py-1">
            <h4 className="text-sm font-bold text-neutral-300 line-clamp-2 group-hover:text-white transition-colors">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
              {item.latest_chapter && (
                <span className="flex items-center gap-1">
                  <BookOpen size={12} /> {item.latest_chapter}
                </span>
              )}
              {item.rating && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Star size={12} className="fill-amber-500" /> {item.rating}
                </span>
              )}
            </div>
          </div>

          <ChevronRight size={16} className="shrink-0 text-neutral-700 self-center" />
        </Link>
      ))}
    </div>
  );
}
