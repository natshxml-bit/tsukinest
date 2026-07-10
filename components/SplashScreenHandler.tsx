"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Tirai 1 (native, dikontrol Android OS/styles.xml) cuma bisa nampilin
 * bg warna solid + ikon kecil. Komponen ini adalah "Tirai 2": overlay
 * full-screen di sisi web yang nampilin splash.png versi lengkap,
 * lalu baru menutup native splash biar transisinya mulus.
 */
export default function SplashScreenHandler() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const cap = (window as any).Capacitor;
    const isNative = cap?.isNativePlatform?.() ?? false;

    // Bukan app Android/iOS (dibuka lewat browser biasa) -> skip overlay ini,
    // biarin app.loading.tsx bawaan Next.js yang jalan.
    if (!isNative) {
      setVisible(false);
      return;
    }

    const hideNativeSplash = async () => {
      try {
        // Tutup Tirai 1 (native) SETELAH Tirai 2 (overlay ini) sudah
        // ke-render di layar, supaya gak ada celah kosong di antaranya.
        await SplashScreen.hide();
      } catch (error) {
        console.log("Splash hide error:", error);
      }
    };

    hideNativeSplash();

    // Overlay tampil sebentar, lalu fade out ke konten asli.
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const removeTimer = setTimeout(() => setVisible(false), 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/splash.png"
        alt="TsukiNest"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
