"use client";
// features/manga/components/MangaInfo.tsx
// Stats grid: author, artist, total chapters, last updated

import { User, Paintbrush, Hash, Clock } from "lucide-react";
import { useAccent } from "@/lib/accent";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: "primary" | "emerald" | "amber" | "sky" | "rose";
}

function StatCard({ icon, label, value, color = "primary" }: StatCardProps) {
  const { style: accentStyle } = useAccent();
  const colorMap: Record<string, string> = {
    primary: cn(accentStyle.text, accentStyle.bg + "/10"),
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    sky: "text-sky-400 bg-sky-500/10",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          colorMap[color] || colorMap.primary
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-bold text-neutral-200 truncate">{value}</p>
      </div>
    </div>
  );
}

interface MangaInfoProps {
  author: string;
  artist: string;
  totalChapters: number;
  updatedAt: string;
}

export function MangaInfo({ author, artist, totalChapters, updatedAt }: MangaInfoProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      <StatCard icon={<User size={15} />} label="Penulis" value={author || "-"} color="primary" />
      <StatCard icon={<Paintbrush size={15} />} label="Ilustrator" value={artist || "-"} color="emerald" />
      <StatCard icon={<Hash size={15} />} label="Total Bab" value={String(totalChapters)} color="amber" />
      <StatCard icon={<Clock size={15} />} label="Update" value={updatedAt || "Baru saja"} color="sky" />
    </div>
  );
}
