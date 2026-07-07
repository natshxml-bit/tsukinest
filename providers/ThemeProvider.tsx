"use client";
// providers/ThemeProvider.tsx
// Thin wrapper — currently the accent/theme system is handled by lib/accent.ts
// (which uses localStorage). This provider can be expanded to hold global
// theme state if a React context is ever needed.

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ColorScheme = "dark" | "light" | "system";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "dark",
  setColorScheme: () => {},
});

const STORAGE_KEY = "tsukinest_color_scheme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ColorScheme | null;
      if (stored) setColorSchemeState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    try {
      localStorage.setItem(STORAGE_KEY, scheme);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
