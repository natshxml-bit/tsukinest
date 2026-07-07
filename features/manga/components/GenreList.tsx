"use client";
// features/manga/components/GenreList.tsx
import { Tag } from "lucide-react";
import { useAccent } from "@/lib/accent";
import Link from "next/link";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

interface GenreListProps {
  genres: string[];
}

export function GenreList({ genres }: GenreListProps) {
  const { style: accentStyle } = useAccent();

  if (genres.length === 0) return null;

  return (
    <div className="bg-[#141414] border border-white/[0.05] rounded-2xl hover:border-white/[0.1] transition-colors duration-300">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg + "/10")}>
            <Tag size={14} className={accentStyle.text} />
          </div>
          <h2 className="text-sm font-bold text-neutral-200">Genre</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.map((g, i) => (
            <Link
              key={i}
              href={`/genre/${g.toLowerCase().replace(/\s+/g, "-")}`}
              className="px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-white/5 text-xs font-semibold text-neutral-400 hover:bg-[#262626] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              {g}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
