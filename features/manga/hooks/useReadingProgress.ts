"use client";

import { useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

export function useReadingProgress(seriesSlug: string) {
  const saveProgress = useCallback(
    async (chapterSlug: string, page: number, chapterNumber: string) => {
      // Pastikan data lengkap dan user sudah login
      if (!seriesSlug || !chapterSlug) return;
      
      const user = auth.currentUser;
      if (!user) return; // Kalau belum login, nggak usah disave ke Firebase

      try {
        // Arahkan ke dokumen progress spesifik user dan seri manga-nya
        const progressRef = doc(db, "users", user.uid, "reading_progress", seriesSlug);
        
        await setDoc(
          progressRef,
          {
            readChapters: arrayUnion(chapterSlug), // Tambah ke daftar chapter yang udah dibaca
            lastReadChapter: chapterSlug, // Update chapter terakhir
            lastReadPage: page, // Opsional: Simpen halaman terakhir dibaca
            updatedAt: serverTimestamp(),
          },
          { merge: true } // Merge true penting biar data lain nggak ketimpa!
        );
      } catch (error) {
        console.error("Gagal menyimpan progress baca:", error);
      }
    },
    [seriesSlug]
  );

  return { saveProgress };
}
