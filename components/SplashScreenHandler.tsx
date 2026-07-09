"use client";

import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

export default function SplashScreenHandler() {
  useEffect(() => {
    const cap = (window as any).Capacitor;

    if (cap?.isNativePlatform()) {
      SplashScreen.hide();
    }
  }, []);

  return null;
}