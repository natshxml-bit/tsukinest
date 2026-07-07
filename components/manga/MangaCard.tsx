"use client";

import { memo } from "react";
import Link from "next/link";
import { Star, Flame, Palette } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatMangaType } from "@/utils/manga";
import SmartImage from "@/components/ui/SmartImage";
import type { MangaItem } from "@/types/manga";

interface MangaCardProps {
  item: MangaItem;
  accentStyle: { bg: string; text: string; border: string };
  variant?: "horizontal" | "grid";
  className?: string;
}

export const MangaCard = memo(function MangaCard({
  item,
  accentStyle,
  variant = "horizontal",
  className = "",
}: MangaCardProps) {
  if (variant === "grid") {
    return (
      <Link href={`/manga/${item.slug}`} className={cn("group flex flex-col h-full", className)}>
        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#1c1c1c] border border-white/[0.04] shadow-lg">
          <SmartImage
            src={item.thumb}
            alt={item.title}
            title={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            {item.is_hot && (
              <span className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-bold text-white", accentStyle.bg)}>
                <Flame className="w-2.5 h-2.5" />HOT
              </span>
            )}
            {item.is_colored && (
              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-bold text-white bg-emerald-500/90">
                <Palette className="w-2.5 h-2.5" />COLOR
              </span>
            )}
          </div>
          <div className="absolute bottom-1.5 inset-x-1.5">
            <p className="text-[9px] text-white/90 truncate">{item.latest_chapter}</p>
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-[11px] font-semibold text-white leading-snug line-clamp-2 mb-1">
            {item.title}
          </h3>
          <div className="flex items-center justify-between gap-1">
            <span className={cn("text-[9px] font-bold", accentStyle.text)}>
              {formatMangaType(item.type)}
            </span>
            {item.rating && Number(item.rating) > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {Number(item.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/manga/${item.slug}`} className={cn("group flex-shrink-0 w-[132px]", className)}>
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1c1c1c] border border-white/[0.04] shadow-lg">
        <SmartImage
          src={item.thumb}
          alt={item.title}
          title={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        {item.is_hot && (
          <span className={cn("absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white", accentStyle.bg)}>
            <Flame className="w-2.5 h-2.5" />HOT
          </span>
        )}
        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] text-white/90 truncate">
          {item.latest_chapter}
        </span>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-[11px] font-semibold text-white/90 leading-snug line-clamp-2">
          {item.title}
        </p>
        <p className={cn("text-[9px] font-bold", accentStyle.text)}>
          {formatMangaType(item.type)}
        </p>
      </div>
    </Link>
  );
});
