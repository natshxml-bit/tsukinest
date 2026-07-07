import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  href?: string;
  accentStyle: { text: string };
  delay?: number;
}

export function SectionHeader({ title, icon, href, accentStyle, delay = 0 }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 mb-3"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-center gap-2">
        <span className={cn("text-sm", accentStyle.text)}>{icon}</span>
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold transition-opacity hover:opacity-80",
            accentStyle.text
          )}
        >
          Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
