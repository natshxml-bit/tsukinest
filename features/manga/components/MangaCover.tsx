"use client";
// features/manga/components/MangaCover.tsx
// Cover image card + title, status badges, and view/follower counts

import { Activity, Calendar, Eye, Users, Zap, Star } from "lucide-react";
import { useAccent } from "@/lib/accent";
import type { MangaDetail } from "@/types/manga";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "info";
  icon?: React.ReactNode;
  className?: string;
}
function Badge({ children, variant = "default", icon, className = "" }: BadgeProps) {
  const { style: accentStyle } = useAccent();
  const variants = {
    default: "bg-[#1c1c1c] text-neutral-400 border-white/[0.05]",
    primary: cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent"),
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/10",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border",
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

interface MangaCoverProps {
  data: MangaDetail;
  accentText: string;
  children: React.ReactNode; // SmartImage passed in
}

export function MangaCover({ data, accentText, children }: MangaCoverProps) {
  return (
    <div className="flex gap-4 md:gap-6 items-end">
      {/* Cover */}
      <div className="shrink-0 w-32 md:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/5 relative bg-[#141414] z-20 group">
        {children}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {data.type && (
          <div className="absolute top-2.5 left-2.5 z-30">
            <Badge variant="primary" icon={<Zap size={10} />}>
              {data.type}
            </Badge>
          </div>
        )}
        {data.rating && data.rating !== "0" && data.rating !== "N/A" && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-[#141414]/90 backdrop-blur-sm border border-white/5 px-2 py-1 rounded-lg z-30">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-white">{data.rating}</span>
          </div>
        )}
      </div>

      {/* Title area */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {data.status && (
            <Badge variant="success" icon={<Activity size={10} />}>
              {data.status}
            </Badge>
          )}
          {data.release_year && (
            <Badge variant="info" icon={<Calendar size={10} />}>
              {data.release_year}
            </Badge>
          )}
        </div>

        <h1 className="text-xl md:text-3xl font-extrabold leading-tight text-white tracking-tight">
          {data.title}
        </h1>

        {data.alternative_title && (
          <p className="text-xs text-neutral-500 mt-1.5 line-clamp-1 font-medium">
            {data.alternative_title}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-3">
          {data.views && data.views !== "0" && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Eye size={13} className={accentText} />
              <span className="font-semibold">{data.views}</span>
              <span className="text-neutral-600">dilihat</span>
            </div>
          )}
          {data.followers && data.followers !== "0" && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Users size={13} className="text-rose-400" />
              <span className="font-semibold">{data.followers}</span>
              <span className="text-neutral-600">pengikut</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
