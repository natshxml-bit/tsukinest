// lib/userSync.ts
// Sinkronisasi dokumen users/{uid} di Firestore + heartbeat buat status online.
// Dipanggil otomatis lewat <PresenceTracker /> yang dipasang di app/layout.tsx,
// jadi jalan di semua halaman tanpa perlu setup manual di tiap page.

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";

export type UserRole = "admin" | "member";

export interface UserDoc {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt?: Timestamp;
  lastActive?: Timestamp;
}

// Anggap user "online" kalau lastActive-nya kurang dari ini.
// Heartbeat jalan tiap 60 detik (lihat PresenceTracker), jadi 3 menit
// ngasih buffer buat tab yang lagi di-background/koneksi lemot.
export const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

export function isOnline(lastActive?: Timestamp | null): boolean {
  if (!lastActive) return false;
  return Date.now() - lastActive.toMillis() < ONLINE_THRESHOLD_MS;
}

/**
 * Bikin dokumen users/{uid} kalau belum ada (role default "member"),
 * atau update profil dasarnya (nama/foto/email/lastActive) kalau udah ada.
 *
 * PENTING: fungsi ini TIDAK PERNAH nulis field `role` di jalur update.
 * Role cuma di-set sekali waktu dokumen pertama kali dibuat. Ini sengaja,
 * biar user yang udah jadi admin gak ke-reset ke "member" tiap login,
 * dan biar client gak punya jalan buat naikin role-nya sendiri.
 * Perubahan role harus lewat Firebase Console (manual) atau Cloud Function
 * admin — bukan dari kode yang jalan di browser user.
 */
export async function ensureUserDocument(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const baseProfile = {
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    lastActive: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...baseProfile,
      role: "member" as UserRole,
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, baseProfile, { merge: true });
  }
}

// Heartbeat ringan, dipanggil berkala selagi user buka app (tab aktif).
export async function pingHeartbeat(uid: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { lastActive: serverTimestamp() }, { merge: true });
}
