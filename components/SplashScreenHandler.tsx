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
    const fadeTimer = setTimeout(() => setFading(true), 1600);
    const removeTimer = setTimeout(() => setVisible(false), 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="splash-logo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/splash.png"
          alt="TsukiNest"
          className="splash-logo"
          draggable={false}
        />
      </div>

      <div className="splash-dots" aria-hidden="true">
        <span className="splash-dot" />
        <span className="splash-dot" />
        <span className="splash-dot" />
      </div>

      <style jsx>{`
        .splash-logo-wrap {
          width: 40vw;
          max-width: 180px;
          animation: splash-fade-in 700ms ease-out both;
        }

        .splash-logo {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 24px;
          object-fit: contain;
        }

        .splash-dots {
          display: flex;
          gap: 8px;
          margin-top: 28px;
        }

        .splash-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.85);
          animation: splash-dot-bounce 900ms ease-in-out infinite;
        }

        .splash-dot:nth-child(2) {
          animation-delay: 150ms;
        }

        .splash-dot:nth-child(3) {
          animation-delay: 300ms;
        }

        @keyframes splash-fade-in {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes splash-dot-bounce {
          0%,
          80%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}
