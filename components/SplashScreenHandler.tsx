"use client";

import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

export default function SplashScreenHandler() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        const cap = (window as any).Capacitor;

        if (cap?.isNativePlatform()) {
          await SplashScreen.hide();
        }
      } catch (error) {
        console.log("Splash hide error:", error);
      }
    };

    const timer = setTimeout(() => {
      hideSplash();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}