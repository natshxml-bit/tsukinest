"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/utils/cn";

interface ScrollToTopProps {
  accentStyle: { bg: string };
}

export function ScrollToTop({ accentStyle }: ScrollToTopProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full border border-white/[0.08] text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:brightness-110",
        accentStyle.bg
      )}
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
