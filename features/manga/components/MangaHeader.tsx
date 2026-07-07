"use client";
// features/manga/components/MangaHeader.tsx
// Hero section: blurred backdrop image + top controls (back, like, share, settings)

import {
  ArrowLeft,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  Heart,
  Share2,
  MoreHorizontal,
  Monitor,
  X,
} from "lucide-react";
import { useAccent } from "@/lib/accent";
import type { ReadingMode, ImageQuality } from "@/features/manga/types";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}
function Card({ children, className = "" }: CardProps) {
  return (
    <div className={cn("bg-[#141414] border border-white/[0.05] rounded-2xl", className)}>
      {children}
    </div>
  );
}

interface MangaHeaderProps {
  thumb: string;
  title: string;
  isLiked: boolean;
  showSettings: boolean;
  readingMode: ReadingMode;
  imageQuality: ImageQuality;
  settingsRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onToggleSettings: () => void;
  onReadingModeChange: (mode: ReadingMode) => void;
  onImageQualityChange: (q: ImageQuality) => void;
  children?: React.ReactNode; // SmartImage from parent
}

export function MangaHeader({
  thumb,
  title,
  isLiked,
  showSettings,
  readingMode,
  imageQuality,
  settingsRef,
  onBack,
  onToggleLike,
  onShare,
  onToggleSettings,
  onReadingModeChange,
  onImageQualityChange,
  children,
}: MangaHeaderProps) {
  const { style: accentStyle } = useAccent();

  const readingModes: { mode: ReadingMode; icon: typeof ArrowDown; label: string }[] = [
    { mode: "vertical", icon: ArrowDown, label: "Vertikal" },
    { mode: "horizontal", icon: ArrowLeftIcon, label: "Horizontal" },
    { mode: "webtoon", icon: Monitor, label: "Webtoon" },
  ];

  return (
    <section className="relative h-[45vh] md:h-[50vh] w-full overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1c1c1c] transition active:scale-95"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        <div className="flex gap-2">
          <button
            onClick={onToggleLike}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm border transition active:scale-95",
              isLiked
                ? "bg-rose-500/20 border-rose-500/30 text-rose-500"
                : "bg-[#141414]/80 border-white/5 hover:bg-[#1c1c1c] text-white"
            )}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>

          <button
            onClick={onShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1c1c1c] transition active:scale-95"
          >
            <Share2 size={16} className="text-white" />
          </button>

          <div className="relative" ref={settingsRef}>
            <button
              onClick={onToggleSettings}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1c1c1c] transition active:scale-95"
            >
              <MoreHorizontal size={16} className="text-white" />
            </button>

            {showSettings && (
              <div className="absolute top-12 right-0 z-30 w-56 animate-in fade-in slide-in-from-top-2 duration-150">
                <Card className="p-4 space-y-4 shadow-2xl">
                  {/* Reading Mode */}
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Mode Baca</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {readingModes.map(({ mode, icon: Icon, label }) => (
                        <button
                          key={mode}
                          onClick={() => onReadingModeChange(mode)}
                          className={cn(
                            "p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition border",
                            readingMode === mode
                              ? cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent")
                              : "bg-[#1c1c1c] text-neutral-400 border-white/5 hover:bg-[#262626]"
                          )}
                        >
                          <Icon size={14} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Quality */}
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Kualitas</p>
                    <div className="flex gap-1.5">
                      {(["high", "medium", "low"] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => onImageQualityChange(q)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-bold transition border",
                            imageQuality === q
                              ? cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent")
                              : "bg-[#1c1c1c] text-neutral-400 border-white/5 hover:bg-[#262626]"
                          )}
                        >
                          {q === "high" ? "Tinggi" : q === "medium" ? "Sedang" : "Rendah"}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
