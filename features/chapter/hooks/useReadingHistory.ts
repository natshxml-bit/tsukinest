"use client";
// features/chapter/hooks/useReadingHistory.ts
// Saves reading history to Firebase Firestore and to localStorage.

import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import type { ReadData } from "@/features/chapter/types";

const READ_CHAPTERS_KEY = "tsukinest_read_chapters";

interface UseReadingHistoryOptions {
  chapterSlug: string;
  data: ReadData | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailData: any | null;
  user: FirebaseUser | null;
}

export function useReadingHistory({
  chapterSlug,
  data,
  detailData,
  user,
}: UseReadingHistoryOptions) {
  /* ─── Save to localStorage ─── */
  useEffect(() => {
    if (!chapterSlug) return;
    try {
      const arr = JSON.parse(localStorage.getItem(READ_CHAPTERS_KEY) || "[]") as string[];
      const filtered = arr.filter((c) => c !== chapterSlug);
      filtered.push(chapterSlug);
      localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }, [chapterSlug]);

  /* ─── Save to Firebase ─── */
  useEffect(() => {
    if (!user || !data) return;
    const save = async () => {
      try {
        const id = data.series_slug || data.manga_id || chapterSlug;
        const ref = doc(db, "users", user.uid, "history", id);
        const chStr = String(data.chapter_number).toLowerCase().includes("ch")
          ? String(data.chapter_number)
          : `Ch. ${data.chapter_number}`;

        // FIX: Ambil thumb dari SEMUA kemungkinan field yang dikirim API.
        // Sebelumnya cuma `thumbnail` / `thumb` — alesan utama card history
        // tampil blank di screenshot user. API real pakai `cover_image_url`
        // (di /detail) dan `thumbnail_image_url` (di /chapter).
        const thumb =
          detailData?.cover_image_url ||
          detailData?.thumbnail ||
          detailData?.thumb ||
          data.thumbnail_image_url ||
          "";

        await setDoc(
          ref,
          {
            id,
            // FIX: kalau series_slug kosong (kayak kasus API chapter baru yang
            // cuma ngirim manga_id), fallback ke manga_id biar doc tetep
            // punya identifier yang konsisten.
            slug: data.series_slug || data.manga_id || chapterSlug,
            chapter_slug: chapterSlug,

            // FIX: title bisa datang dari banyak sumber, urutin dari
            // yang paling reliable (detail / /detail) → chapter API →
            // safety net.
            title: detailData?.title || data.series_title || data.title || "Unknown",

            lastReadChapter: chStr,
            latest_chapter: chStr,

            savedAt: Date.now(),
            lastReadAt: Date.now(),

            // Simpen ke SEMUA alias biar kompatibel sama library reader
            // lama (cleanThumbRaw) maupun yang baru.
            thumb,
            cover_image_url: thumb,
            thumbnail_image_url: thumb,

            type: detailData?.type || "MANGA",
            status: detailData?.status || "",
          },
          { merge: true }
        );
      } catch {
        // non-critical, silent fail
      }
    };
    save();
  }, [user, data, detailData, chapterSlug]);
}

/** Thin hook to subscribe to Firebase auth changes */
export function useAuthUser(
  setUser: (u: FirebaseUser | null) => void
) {
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, [setUser]);
}