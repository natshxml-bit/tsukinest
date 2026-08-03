"use client";
// components/UpdateNotifier.tsx
// Cek versi APK terpasang vs versi terbaru dari /api/latest-version.
// Kalau versi terpasang ketinggalan, munculin popup "Update tersedia"
// + tombol download. Cuma aktif di APK native (web gak butuh update APK).
//
// Karena APK ini webview yang load situs live, perubahan web otomatis
// nyampe ke semua APK — jadi begitu notif ini di-deploy, APK 1.1 yang
// masih terpasang langsung dapet popup update begitu versi baru di-set.

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Download, X, Sparkles } from "lucide-react";

type LatestVersion = {
  versionName: string;
  versionCode: number;
  apkUrl: string;
  notes: string;
};

export default function UpdateNotifier() {
  const [info, setInfo] = useState<LatestVersion | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const run = async () => {
      try {
        const appInfo = await App.getInfo();
        const installedCode = Number(appInfo.build || 0);

        const res = await fetch("/api/latest-version");
        if (!res.ok) return;
        const data = (await res.json()) as { version?: LatestVersion | null };
        if (cancelled) return;

        const latest = data.version;
        if (!latest || !latest.versionCode || !latest.apkUrl) return;
        if (latest.versionCode <= installedCode) return;

        // Sengaja gak di-dismiss permanen: selama versi terpasang masih
        // ketinggalan, popup muncul lagi tiap app dibuka. "Nanti" cuma
        // nutup untuk sesi itu aja.
        setInfo(latest);
      } catch (err) {
        console.error("UpdateNotifier: gagal cek update:", err);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  const dismiss = () => {
    setInfo(null);
  };

  const download = async () => {
    try {
      await Browser.open({ url: info.apkUrl });
    } catch {
      window.open(info.apkUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 px-4 pb-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Update tersedia</h3>
              <p className="text-[11px] text-zinc-400">Versi {info.versionName} • APK</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-zinc-400 transition hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {info.notes ? (
          <p className="mt-3 text-xs leading-relaxed text-zinc-300">{info.notes}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={dismiss}
            className="rounded-xl border border-zinc-800 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
          >
            Nanti
          </button>
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
