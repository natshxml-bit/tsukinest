"use client";

import { useEffect, useState } from "react";
import { X, Download, Compass, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ready, setReady] = useState(false);
  
  // State untuk menangani fallback deteksi
  const [isIOS, setIsIOS] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  useEffect(() => {
    setReady(true);

    // 1. Cek kalau sudah terinstall / standalone mode
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone;
      
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Cek deteksi iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isApple);

    // 3. Cek apakah user baru saja menutup prompt (cooldown 24 jam)
    const dismissed = localStorage.getItem("pwa_dismiss");
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    // 4. Listener standard PWA jika disupport browser (Chrome Android, dll)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setIsManualMode(false); // Aman, browser mendukung jalur otomatis
      setTimeout(() => {
        setShow(true);
      }, 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    // 5. 🔥 FALLBACK TIMER (Untuk Kiwi Browser / Safari iOS yang pelit trigger event)
    const fallback = setTimeout(() => {
      // Jika setelah 6 detik event belum trigger, aktifkan mode manual petunjuk
      if (!deferred) {
        setIsManualMode(true);
        setShow(true);
      }
    }, 6000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallback);
    };
  }, [deferred]);

  if (!ready || installed) return null;
  if (!show) return null;

  const handleInstall = async () => {
    // Jalur Otomatis (Browser support)
    if (deferred) {
      await deferred.prompt();
      const res = await deferred.userChoice;
      if (res.outcome === "accepted") {
        setShow(false);
      }
      setDeferred(null);
    }
  };

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("pwa_dismiss", String(Date.now()));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl shadow-black/80">
        
        {/* Tombol Close */}
        <button 
          onClick={handleClose} 
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-base text-zinc-100">Install TsukiNest</h3>
        </div>

        {/* Konten Dinamis Berdasarkan Kondisi Browser */}
        {isIOS ? (
          <div>
            <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
              Khusus Safari iOS: Klik ikon <Share className="inline w-4 h-4 mx-1 text-blue-400" /> <strong>Share</strong> di bawah browser, lalu pilih opsi <strong>"Add to Home Screen"</strong>.
            </p>
            <div className="w-full text-center py-2 px-3 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-medium border border-zinc-800">
              📱 Ikuti panduan manual di atas
            </div>
          </div>
        ) : isManualMode ? (
          <div>
            <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
              Browser kamu (seperti Kiwi) tidak mendukung install otomatis. Klik menu <Compass className="inline w-4 h-4 mx-1 text-zinc-400" /> <strong>titik tiga</strong> di pojok kanan atas browser, lalu klik <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
            </p>
            <button 
              onClick={handleClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-medium text-sm transition"
            >
              Saya Mengerti
            </button>
          </div>
        ) : (
          <div>
            <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
              Install aplikasi untuk pengalaman baca manhwa yang lebih cepat, responsif, dan hemat kuota langsung dari homescreen.
            </p>
            <button 
              onClick={handleInstall} 
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-2.5 rounded-xl font-semibold text-sm transition"
            >
              <Download className="w-4 h-4" /> Install Aplikasi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
