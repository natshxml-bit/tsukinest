"use client";

import { Download, X } from "lucide-react";
import { useState } from "react";

export default function InstallPrompt() {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-white shadow-2xl">

        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="mb-2 font-semibold text-base">
          Install TsukiNest APK
        </h3>

        <p className="mb-4 text-xs text-zinc-400">
          Dapatkan pengalaman baca lebih cepat dengan aplikasi Android TsukiNest.
        </p>

        <a
          href="/downloads/tsukinest.apk"
          download
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          <Download className="h-4 w-4" />
          Download APK
        </a>

      </div>
    </div>
  );
}