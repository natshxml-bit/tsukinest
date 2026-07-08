"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";

export default function BackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform();
    if (!isCapacitor) return;

    let handlerPromise = App.addListener("backButton", ({ canGoBack }) => {
      if (window.history.length > 1) {
        router.back();
      } else {
        App.exitApp();
      }
    });

    return () => {
      handlerPromise.then((handler) => handler.remove());
    };
  }, [router]);

  return null;
}