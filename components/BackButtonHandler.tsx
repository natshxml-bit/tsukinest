"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";

export default function BackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if running in Capacitor
    const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform();

    if (!isCapacitor) return;

    const handler = App.addListener("backButton", ({ canGoBack }) => {
      // Check if there's history to go back
      if (window.history.length > 1) {
        router.back();
      } else {
        // Exit app if no history
        App.exitApp();
      }
    });

    return () => {
      handler.remove();
    };
  }, [router]);

  return null; // This component doesn't render anything
}