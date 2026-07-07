"use client";
// features/manga/components/Description.tsx
import { useState } from "react";
import { BookOpen, ChevronUp, ChevronDown } from "lucide-react";
import { useAccent } from "@/lib/accent";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

interface DescriptionProps {
  synopsis: string;
}

export function Description({ synopsis }: DescriptionProps) {
  const { style: accentStyle } = useAccent();
  const [showFull, setShowFull] = useState(false);
  const isLong = synopsis.length > 180;

  return (
    <div className="bg-[#141414] border border-white/[0.05] rounded-2xl hover:border-white/[0.1] transition-colors duration-300">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg + "/10")}>
            <BookOpen size={14} className={accentStyle.text} />
          </div>
          <h2 className="text-sm font-bold text-neutral-200">Sinopsis</h2>
        </div>

        <div className="relative">
          <p
            className={cn(
              "text-sm text-neutral-400 leading-relaxed font-medium",
              !showFull && isLong && "line-clamp-4"
            )}
          >
            {synopsis}
          </p>
          {!showFull && isLong && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#141414] to-transparent" />
          )}
        </div>

        {isLong && (
          <button
            onClick={() => setShowFull(!showFull)}
            className={cn("mt-3 text-xs font-bold flex items-center gap-1 transition", accentStyle.text)}
          >
            {showFull ? "Sembunyikan" : "Baca Selengkapnya"}
            {showFull ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
