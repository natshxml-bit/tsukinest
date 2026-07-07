"use client";
// providers/AppProvider.tsx
// Root provider that composes all app-level providers.
// Add future providers (ReactQueryProvider, AuthProvider, etc.) here.

import { type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
