"use client";
// features/chapter/hooks/useKeyboardControl.ts
// Keyboard navigation for the chapter reader.

import { useEffect } from "react";

interface UseKeyboardControlOptions {
  onNext: () => void;
  onPrev: () => void;
  onEscape: () => void;
}

export function useKeyboardControl({
  onNext,
  onPrev,
  onEscape,
}: UseKeyboardControlOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture keyboard events when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === "d" || e.key === " ") {
        e.preventDefault();
        onNext();
      }
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault();
        onPrev();
      }
      if (e.key === "Escape") {
        onEscape();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext, onPrev, onEscape]);
}
