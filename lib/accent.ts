"use client";

import { useState, useEffect, useCallback } from "react";

export type Accent =
  | "purple" | "violet" | "sky" | "cyan" | "rose" | "emerald" | "amber"
  | "pink" | "blue" | "indigo" | "lime" | "orange" | "teal" | "red" | "slate"
  | "gold" | "mint" | "charcoal" | "sea" | "electric" | "neonPink" | "acidLime"
  | "lavender" | "peach" | "blood" | "deepSea" | "forest" | "sand" | "bronze"
  | "custom"; // <-- Tambahin tipe custom

export const ACCENT_MAP: Record<
  Accent,
  {
    bg: string;
    text: string;
    border: string;
    glow: string;
    soft: string;
    hex: string;
    gradient: string;
    focusRing: string;
    hoverSoft: string;
  }
> = {
  // Core
  purple:   { bg: "bg-violet-600",  text: "text-violet-400",  border: "border-violet-500/20",  glow: "shadow-violet-600/20",  soft: "bg-violet-500/10",  hex: "#7c3aed", gradient: "from-violet-400 via-fuchsia-500 to-purple-600",  focusRing: "focus:ring-violet-500/50",  hoverSoft: "hover:bg-violet-500/20" },
  violet:   { bg: "bg-purple-600",  text: "text-purple-400",  border: "border-purple-500/20",  glow: "shadow-purple-600/20",  soft: "bg-purple-500/10",  hex: "#9333ea", gradient: "from-purple-400 via-violet-500 to-indigo-600",   focusRing: "focus:ring-purple-500/50",  hoverSoft: "hover:bg-purple-500/20" },
  sky:      { bg: "bg-sky-600",     text: "text-sky-400",     border: "border-sky-500/20",     glow: "shadow-sky-600/20",     soft: "bg-sky-500/10",     hex: "#0284c7", gradient: "from-sky-400 via-blue-500 to-cyan-600",        focusRing: "focus:ring-sky-500/50",     hoverSoft: "hover:bg-sky-500/20" },
  cyan:     { bg: "bg-cyan-600",    text: "text-cyan-400",    border: "border-cyan-500/20",    glow: "shadow-cyan-600/20",    soft: "bg-cyan-500/10",    hex: "#0891b2", gradient: "from-cyan-400 via-blue-500 to-teal-600",        focusRing: "focus:ring-cyan-500/50",    hoverSoft: "hover:bg-cyan-500/20" },
  rose:     { bg: "bg-rose-600",    text: "text-rose-400",    border: "border-rose-500/20",    glow: "shadow-rose-600/20",    soft: "bg-rose-500/10",    hex: "#e11d48", gradient: "from-rose-400 via-pink-500 to-red-600",          focusRing: "focus:ring-rose-500/50",    hoverSoft: "hover:bg-rose-500/20" },
  emerald:  { bg: "bg-emerald-600", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-600/20", soft: "bg-emerald-500/10", hex: "#059669", gradient: "from-emerald-400 via-green-500 to-teal-600",    focusRing: "focus:ring-emerald-500/50", hoverSoft: "hover:bg-emerald-500/20" },
  amber:    { bg: "bg-amber-600",   text: "text-amber-400",   border: "border-amber-500/20",   glow: "shadow-amber-600/20",   soft: "bg-amber-500/10",   hex: "#d97706", gradient: "from-amber-400 via-yellow-500 to-orange-600",  focusRing: "focus:ring-amber-500/50",   hoverSoft: "hover:bg-amber-500/20" },
  pink:     { bg: "bg-pink-600",    text: "text-pink-400",    border: "border-pink-500/20",    glow: "shadow-pink-600/20",    soft: "bg-pink-500/10",    hex: "#db2777", gradient: "from-pink-400 via-rose-500 to-fuchsia-600",    focusRing: "focus:ring-pink-500/50",    hoverSoft: "hover:bg-pink-500/20" },
  blue:     { bg: "bg-blue-600",    text: "text-blue-400",    border: "border-blue-500/20",    glow: "shadow-blue-600/20",    soft: "bg-blue-500/10",    hex: "#2563eb", gradient: "from-blue-400 via-indigo-500 to-violet-600",    focusRing: "focus:ring-blue-500/50",    hoverSoft: "hover:bg-blue-500/20" },
  indigo:   { bg: "bg-indigo-600",  text: "text-indigo-400",  border: "border-indigo-500/20",  glow: "shadow-indigo-600/20",  soft: "bg-indigo-500/10",  hex: "#4f46e5", gradient: "from-indigo-400 via-purple-500 to-blue-600",      focusRing: "focus:ring-indigo-500/50",  hoverSoft: "hover:bg-indigo-500/20" },
  lime:     { bg: "bg-lime-600",    text: "text-lime-400",    border: "border-lime-500/20",    glow: "shadow-lime-600/20",    soft: "bg-lime-500/10",    hex: "#65a30d", gradient: "from-lime-400 via-green-500 to-emerald-600",    focusRing: "focus:ring-lime-500/50",    hoverSoft: "hover:bg-lime-500/20" },
  orange:   { bg: "bg-orange-600",  text: "text-orange-400",  border: "border-orange-500/20",  glow: "shadow-orange-600/20",  soft: "bg-orange-500/10",  hex: "#ea580c", gradient: "from-orange-400 via-red-500 to-rose-600",       focusRing: "focus:ring-orange-500/50",  hoverSoft: "hover:bg-orange-500/20" },
  teal:     { bg: "bg-teal-600",    text: "text-teal-400",    border: "border-teal-500/20",    glow: "shadow-teal-600/20",    soft: "bg-teal-500/10",    hex: "#0d9488", gradient: "from-teal-400 via-cyan-500 to-blue-600",        focusRing: "focus:ring-teal-500/50",    hoverSoft: "hover:bg-teal-500/20" },
  red:      { bg: "bg-red-600",     text: "text-red-400",     border: "border-red-500/20",     glow: "shadow-red-600/20",     soft: "bg-red-500/10",     hex: "#dc2626", gradient: "from-red-400 via-orange-500 to-rose-600",       focusRing: "focus:ring-red-500/50",     hoverSoft: "hover:bg-red-500/20" },
  slate:    { bg: "bg-slate-600",   text: "text-slate-400",   border: "border-slate-500/20",   glow: "shadow-slate-600/20",   soft: "bg-slate-500/10",   hex: "#475569", gradient: "from-slate-400 via-slate-500 to-gray-600",     focusRing: "focus:ring-slate-500/50",   hoverSoft: "hover:bg-slate-500/20" },

  // Extended
  gold:     { bg: "bg-yellow-500",  text: "text-yellow-400",  border: "border-yellow-500/30",  glow: "shadow-yellow-500/20",  soft: "bg-yellow-500/10",  hex: "#eab308", gradient: "from-yellow-400 to-amber-600",                focusRing: "focus:ring-yellow-500/50",  hoverSoft: "hover:bg-yellow-500/20" },
  mint:     { bg: "bg-emerald-400", text: "text-emerald-300", border: "border-emerald-400/30", glow: "shadow-emerald-400/20", soft: "bg-emerald-400/10", hex: "#34d399", gradient: "from-emerald-300 to-teal-500",                focusRing: "focus:ring-emerald-400/50", hoverSoft: "hover:bg-emerald-400/20" },
  charcoal: { bg: "bg-gray-700",    text: "text-gray-400",    border: "border-gray-600/30",    glow: "shadow-gray-700/20",    soft: "bg-gray-700/10",    hex: "#374151", gradient: "from-gray-600 to-gray-800",                   focusRing: "focus:ring-gray-600/50",    hoverSoft: "hover:bg-gray-700/20" },
  sea:      { bg: "bg-blue-800",    text: "text-blue-300",    border: "border-blue-800/30",    glow: "shadow-blue-800/20",    soft: "bg-blue-800/10",    hex: "#1e40af", gradient: "from-blue-800 to-indigo-900",                focusRing: "focus:ring-blue-800/50",    hoverSoft: "hover:bg-blue-800/20" },

  // Neon / Electric
  electric: { bg: "bg-blue-500",    text: "text-blue-400",    border: "border-blue-500/30",    glow: "shadow-blue-500/20",    soft: "bg-blue-500/10",    hex: "#3b82f6", gradient: "from-blue-500 to-cyan-400",                  focusRing: "focus:ring-blue-500/50",    hoverSoft: "hover:bg-blue-500/20" },
  neonPink: { bg: "bg-pink-500",    text: "text-pink-400",    border: "border-pink-500/30",    glow: "shadow-pink-500/20",    soft: "bg-pink-500/10",    hex: "#ec4899", gradient: "from-pink-500 to-purple-500",                focusRing: "focus:ring-pink-500/50",    hoverSoft: "hover:bg-pink-500/20" },
  acidLime: { bg: "bg-lime-400",    text: "text-lime-300",    border: "border-lime-400/30",    glow: "shadow-lime-400/20",    soft: "bg-lime-400/10",    hex: "#a3e635", gradient: "from-lime-400 to-emerald-400",              focusRing: "focus:ring-lime-400/50",    hoverSoft: "hover:bg-lime-400/20" },

  // Soft Pastel
  lavender: { bg: "bg-violet-300",  text: "text-violet-200",  border: "border-violet-300/30",  glow: "shadow-violet-300/20",  soft: "bg-violet-300/10",  hex: "#c4b5fd", gradient: "from-violet-300 to-indigo-300",              focusRing: "focus:ring-violet-300/50",  hoverSoft: "hover:bg-violet-300/20" },
  peach:    { bg: "bg-orange-300",  text: "text-orange-200",  border: "border-orange-300/30",  glow: "shadow-orange-300/20",  soft: "bg-orange-300/10",  hex: "#fdba74", gradient: "from-orange-300 to-red-300",                  focusRing: "focus:ring-orange-300/50",  hoverSoft: "hover:bg-orange-300/20" },

  // Dark & Luxe
  blood:    { bg: "bg-red-700",     text: "text-red-400",     border: "border-red-700/30",     glow: "shadow-red-700/20",     soft: "bg-red-700/10",     hex: "#b91c1c", gradient: "from-red-700 to-rose-900",                   focusRing: "focus:ring-red-700/50",     hoverSoft: "hover:bg-red-700/20" },
  deepSea:  { bg: "bg-blue-900",    text: "text-blue-400",    border: "border-blue-900/30",    glow: "shadow-blue-900/20",    soft: "bg-blue-900/10",    hex: "#1e3a8a", gradient: "from-blue-900 to-indigo-950",              focusRing: "focus:ring-blue-900/50",    hoverSoft: "hover:bg-blue-900/20" },

  // Earth Tone
  forest:   { bg: "bg-green-800",   text: "text-green-500",   border: "border-green-800/30",   glow: "shadow-green-800/20",   soft: "bg-green-800/10",   hex: "#065f46", gradient: "from-green-800 to-emerald-900",              focusRing: "focus:ring-green-800/50",   hoverSoft: "hover:bg-green-800/20" },
  sand:     { bg: "bg-stone-500",   text: "text-stone-400",   border: "border-stone-500/30",   glow: "shadow-stone-500/20",   soft: "bg-stone-500/10",   hex: "#78716c", gradient: "from-stone-500 to-stone-700",                focusRing: "focus:ring-stone-500/50",   hoverSoft: "hover:bg-stone-500/20" },
  bronze:   { bg: "bg-amber-800",   text: "text-amber-500",   border: "border-amber-800/30",   glow: "shadow-amber-800/20",   soft: "bg-amber-800/10",   hex: "#92400e", gradient: "from-amber-800 to-yellow-900",              focusRing: "focus:ring-amber-800/50",   hoverSoft: "hover:bg-amber-800/20" },
  
  // Custom Inject
  custom:   { bg: "tsuki-custom-bg", text: "tsuki-custom-text", border: "tsuki-custom-border", glow: "tsuki-custom-glow", soft: "tsuki-custom-soft", hex: "var(--tsuki-custom-hex)", gradient: "tsuki-custom-gradient", focusRing: "tsuki-custom-focus", hoverSoft: "tsuki-custom-hover" },
};

export function useAccent() {
  const [accent, setAccentState] = useState<Accent>("purple");
  const [customHex, setCustomHexState] = useState<string>("#7c3aed");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Load accent
    const savedAccent = localStorage.getItem("tsuki_accent") as Accent | null;
    if (savedAccent && ACCENT_MAP[savedAccent]) setAccentState(savedAccent);

    // Load custom hex
    const savedHex = localStorage.getItem("tsuki_custom_hex");
    if (savedHex) setCustomHexState(savedHex);

    const handler = (e: StorageEvent) => {
      if (e.key === "tsuki_accent" && e.newValue && ACCENT_MAP[e.newValue as Accent]) {
        setAccentState(e.newValue as Accent);
      }
      if (e.key === "tsuki_custom_hex" && e.newValue) {
        setCustomHexState(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Effect buat bikin CSS dinamis secara instan
  useEffect(() => {
    if (typeof document === "undefined") return;
    let styleEl = document.getElementById("tsuki-custom-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "tsuki-custom-style";
      document.head.appendChild(styleEl);
    }

    const hex = customHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const rgb = `${r}, ${g}, ${b}`;

    // Inject class CSS-nya biar support glow, opacity, dll
    styleEl.innerHTML = `
      :root {
        --tsuki-custom-rgb: ${rgb};
        --tsuki-custom-hex: ${customHex};
      }
      .tsuki-custom-bg { background-color: rgb(var(--tsuki-custom-rgb)) !important; }
      .tsuki-custom-text { color: rgb(var(--tsuki-custom-rgb)) !important; }
      .tsuki-custom-border { border-color: rgba(var(--tsuki-custom-rgb), 0.2) !important; }
      .tsuki-custom-glow { box-shadow: 0 4px 15px rgba(var(--tsuki-custom-rgb), 0.2) !important; }
      .tsuki-custom-soft { background-color: rgba(var(--tsuki-custom-rgb), 0.1) !important; }
      .tsuki-custom-focus:focus { box-shadow: 0 0 0 2px rgba(var(--tsuki-custom-rgb), 0.5) !important; outline: none; }
      .tsuki-custom-hover:hover { background-color: rgba(var(--tsuki-custom-rgb), 0.2) !important; }
      .tsuki-custom-gradient { background-image: linear-gradient(to right, rgb(var(--tsuki-custom-rgb)), rgba(var(--tsuki-custom-rgb), 0.6)) !important; }
    `;
  }, [customHex]);

  const setAccent = useCallback((val: Accent) => {
    setAccentState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("tsuki_accent", val);
    }
  }, []);

  const setCustomHex = useCallback((val: string) => {
    setCustomHexState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("tsuki_custom_hex", val);
    }
  }, []);

  return { accent, style: ACCENT_MAP[accent], setAccent, customHex, setCustomHex };
}
