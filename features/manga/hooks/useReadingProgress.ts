"use client";

import { useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

export function useReadingProgress(seriesSlug: string) {
  const saveProgress = useCallback(
    async (
      chapterSlug: string,
      page: number,
      chapterNumber: string,
      isCompleted: boolean = false
    ) => {
      // Pastikan data lengkap dan user sudah login
      if (!seriesSlug || !chapterSlug) return;
      
      const user = auth.currentUser;
      if (!user) return; // Kalau belum login, nggak usah disave ke Firebase

      try {
        // Arahkan ke dokumen progress spesifik user dan seri manga-nya
        const progressRef = doc(db, "users", user.uid, "reading_progress", seriesSlug);

        // lastReadChapter/lastReadPage selalu diupdate biar "lanjutkan baca" akurat.
        // readChapters (badge "Selesai") CUMA ditambah kalau chapter beneran
        // udah kebaca sampai halaman terakhir — bukan cuma dibuka/diklik.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
          lastReadChapter: chapterSlug, // Update chapter terakhir
          lastReadPage: page, // Opsional: Simpen halaman terakhir dibaca
          updatedAt: serverTimestamp(),
        };
        if (isCompleted) {
          payload.readChapters = arrayUnion(chapterSlug);
        }

        await setDoc(progressRef, payload, { merge: true }); // Merge true penting biar data lain nggak ketimpa!
      } catch (error) {
        console.error("Gagal menyimpan progress baca:", error);
      }
    },
    [seriesSlug]
  );

  return { saveProgress };
}
