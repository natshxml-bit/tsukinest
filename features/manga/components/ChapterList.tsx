"use client";
// features/manga/components/ChapterList.tsx
import Link from "next/link";
import {
  Layers, Search, SortAsc, SortDesc, ChevronRight,
  ChevronDown, ChevronUp, Flame, Bookmark, Check, Calendar, Eye,
} from "lucide-react";
import { useAccent } from "@/lib/accent";
import type { ChapterItem } from "@/types/manga";
import type { SortOrder } from "@/features/manga/types";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning";
  icon?: React.ReactNode;
}
function Badge({ children, variant = "primary", icon }: BadgeProps) {
  const { style: accentStyle } = useAccent();
  const variants = {
    primary: cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent"),
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border", variants[variant])}>
      {icon}{children}
    </span>
  );
}

interface ChapterListProps {
  seriesSlug: string;
  shownChapters: ChapterItem[];
  sortedChapters: ChapterItem[];
  totalChapters: number;
  readChapters: string[];
  lastReadChapter: string | null;
  chapterFilter: string;
  chapterSort: SortOrder;
  showAll: boolean;
  chapterListRef: React.RefObject<HTMLDivElement | null>;
  onFilterChange: (v: string) => void;
  onSortToggle: () => void;
  onShowAllToggle: () => void;
  onChapterRead: (slug: string) => void;
}

export function ChapterList({
  seriesSlug,
  shownChapters,
  sortedChapters,
  totalChapters,
  readChapters,
  lastReadChapter,
  chapterFilter,
  chapterSort,
  showAll,
  chapterListRef,
  onFilterChange,
  onSortToggle,
  onShowAllToggle,
  onChapterRead,
}: ChapterListProps) {
  const { style: accentStyle } = useAccent();

  return (
    <div className="bg-[#141414] border border-white/[0.05] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg + "/10")}>
            <Layers size={14} className={accentStyle.text} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-200">Daftar Bab</h2>
            <p className="text-[10px] text-neutral-500">{totalChapters} bab tersedia</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Cari bab..."
              value={chapterFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#1c1c1c] border border-white/5 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/10 transition w-36"
            />
          </div>
          <button
            onClick={onSortToggle}
            className="p-2 rounded-lg bg-[#1c1c1c] border border-white/5 hover:bg-[#262626] transition text-neutral-400 hover:text-white"
            title={chapterSort === "newest" ? "Terbaru" : "Terlama"}
          >
            {chapterSort === "newest" ? <SortDesc size={15} /> : <SortAsc size={15} />}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a]" ref={chapterListRef}>
        {shownChapters.length === 0 ? (
          <div className="p-8 text-center text-neutral-600 text-sm">Tidak ada bab yang cocok</div>
        ) : (
          shownChapters.map((ch, idx) => {
            const isRead = readChapters.includes(ch.slug);
            const isLatest = chapterSort === "newest" && idx === 0 && !chapterFilter;
            const isLastRead = lastReadChapter === ch.slug;

            return (
              <Link
                key={`${ch.slug}-${idx}`}
                id={`chapter-${ch.slug}`}
                href={`/chapter/${seriesSlug}/${ch.slug}`}
                prefetch={false}
                onClick={() => onChapterRead(ch.slug)}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 transition border-b border-white/[0.02] last:border-0 group relative",
                  isRead ? "bg-[#0a0a0a]" : "bg-[#141414] hover:bg-[#1c1c1c]",
                  isLastRead && "bg-[#1c1c1c]"
                )}
              >
                {isLastRead && (
                  <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", accentStyle.bg)} />
                )}

                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      isRead
                        ? "bg-neutral-700"
                        : isLatest
                        ? cn(accentStyle.bg, "animate-pulse")
                        : "bg-neutral-600"
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          "text-sm font-semibold transition truncate",
                          isRead ? "text-neutral-500" : "text-neutral-300 group-hover:text-white"
                        )}
                      >
                        {ch.chapter_number}
                      </p>
                      {isLatest && <Badge variant="primary" icon={<Flame size={8} />}>Baru</Badge>}
                      {isLastRead && <Badge variant="warning" icon={<Bookmark size={8} />}>Terakhir</Badge>}
                      {isRead && <Badge variant="success" icon={<Check size={8} />}>Selesai</Badge>}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {ch.release_date && (
                        <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                          <Calendar size={10} /> {ch.release_date}
                        </span>
                      )}
                      {ch.views && String(ch.views) !== "0" && (
                        <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                          <Eye size={10} /> {ch.views}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className={cn(
                    "shrink-0 transition text-neutral-600",
                    !isRead && "group-hover:translate-x-0.5"
                  )}
                />
              </Link>
            );
          })
        )}
      </div>

      {sortedChapters.length > 15 && (
        <button
          onClick={onShowAllToggle}
          className={cn(
            "w-full py-3.5 text-xs font-bold uppercase tracking-wide transition border-t border-white/5 flex items-center justify-center gap-1.5",
            accentStyle.text,
            "bg-[#141414] hover:bg-[#1c1c1c]"
          )}
        >
          {showAll ? (
            <>Tampilkan Lebih Sedikit <ChevronUp size={14} /></>
          ) : (
            <>Muat Semua Bab ({sortedChapters.length}) <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
}
