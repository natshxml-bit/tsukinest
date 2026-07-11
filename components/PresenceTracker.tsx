"use client";
// components/PresenceTracker.tsx
// Komponen tak-terlihat yang jagain data kehadiran user:
//  1. Bikin/sync dokumen users/{uid} pas user login (lewat ensureUserDocument)
//  2. Kirim heartbeat (`lastActive`) tiap 1 menit selagi tab aktif
//
// Dipasang SEKALI di app/layout.tsx supaya jalan di semua halaman.
// Tanpa ini, dashboard admin gak akan punya data user & status online.

import { useEffect, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserDocument, pingHeartbeat } from "@/lib/userSync";

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 menit

export default function PresenceTracker() {
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      currentUserRef.current = user;
      if (user) {
        ensureUserDocument(user).catch((err) => {
          console.error("PresenceTracker: gagal sync dokumen user:", err);
        });
      }
    });

    const heartbeat = () => {
      const user = currentUserRef.current;
      if (user && document.visibilityState === "visible") {
        pingHeartbeat(user.uid).catch(() => {
          // Diem-diem aja kalau gagal, gak perlu ganggu UX user.
        });
      }
    };

    const intervalId = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", heartbeat);

    return () => {
      unsubAuth();
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, []);

  return null;
}
