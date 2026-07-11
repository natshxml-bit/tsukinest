"use client";
// features/chapter/components/ChapterNavigation.tsx
// Fixed bottom footer: progress bar + prev/next chapter + comments/settings buttons.

import { ChevronLeft, ChevronRight, MessageCircle, Settings, RefreshCw } from "lucide-react";
import { useAccent } from "@/lib/accent";

interface ChapterNavigationProps {
  showUI: boolean;
  progress: number;
  hasPrev: boolean;
  hasNext: boolean;
  commentCount: number;
  onPrev: () => void;
  onNext: () => void;
  onOpenComments: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

export function ChapterNavigation({
  showUI,
  progress,
  hasPrev,
  hasNext,
  commentCount,
  onPrev,
  onNext,
  onOpenComments,
  onOpenSettings,
  onRefresh,
}: ChapterNavigationProps) {
  const { style: accentStyle } = useAccent();

  return (
    <footer
      className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-500 ${
        showUI ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {/* Progress bar */}
      <div className="h-[2px] bg-white/5">
        <div
          className={`h-full ${accentStyle.bg} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-gradient-to-t from-black via-black/90 to-transparent pt-4 pb-5 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors text-xs font-medium text-gray-400 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={onRefresh}
              className="p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 active:scale-95"
              aria-label="Muat ulang chapter"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenComments}
              className="p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 relative active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              {commentCount > 0 && (
                <span
                  className={`absolute top-2 right-2 w-2 h-2 ${accentStyle.bg} rounded-full ring-2 ring-black`}
                />
              )}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors text-xs font-medium text-gray-400 active:scale-95"
          >
            Selanjutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
