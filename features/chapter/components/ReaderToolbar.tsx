"use client";
// features/chapter/components/ReaderToolbar.tsx
// Fixed top header: back, title/chapter info, chapter list toggle, home button.

import { ChevronLeft, Menu, Home } from "lucide-react";
import { useAccent } from "@/lib/accent";

interface ReaderToolbarProps {
  seriesTitle: string;
  chapterNumber: string | number;
  showUI: boolean;
  onBack: () => void;
  onOpenChapterList: () => void;
  onHome: () => void;
}

export function ReaderToolbar({
  seriesTitle,
  chapterNumber,
  showUI,
  onBack,
  onOpenChapterList,
  onHome,
}: ReaderToolbarProps) {
  const { style: accentStyle } = useAccent();

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        showUI ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-b from-black/80 via-black/50 to-transparent pt-4 pb-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>

          <div className="flex-1 min-w-0 text-center px-2">
            <h1 className="text-sm font-bold text-white/90 truncate tracking-tight">
              {seriesTitle}
            </h1>
            <p className={`text-xs font-medium mt-0.5 ${accentStyle.text}`}>
              Bab {chapterNumber}
            </p>
          </div>

          <button
            onClick={onOpenChapterList}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95"
            title="Daftar Chapter"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          <button
            onClick={onHome}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95"
            title="Beranda"
          >
            <Home className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
