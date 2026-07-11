"use client";
// features/admin/hooks/useAdminGuard.ts
// Gerbang akses buat halaman admin: cek user login + baca field `role`
// dari dokumen Firestore users/{uid}.
//
// PENTING: ini cuma gerbang di sisi UI (biar non-admin gak lihat isi
// dashboard). Keamanan yang SEBENARNYA tetap harus ditegakkan oleh
// Firestore Security Rules (lihat firestore.rules di root project),
// karena kode yang jalan di browser selalu bisa dibaca & diakalin orang.

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserRole } from "@/lib/userSync";

export type AdminGuardStatus =
  | "loading"
  | "unauthenticated"
  | "forbidden"
  | "authorized";

export function useAdminGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoaded(true);
      if (!u) {
        setRole(null);
        setRoleLoaded(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setRoleLoaded(false);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setRole((data?.role as UserRole) ?? "member");
        setRoleLoaded(true);
      },
      () => {
        // Gagal baca dokumen sendiri (misal Firestore Rules belum
        // di-deploy) -> anggap bukan admin, aman ke arah "ditolak".
        setRole("member");
        setRoleLoaded(true);
      }
    );
    return () => unsub();
  }, [user]);

  let status: AdminGuardStatus = "loading";
  if (authLoaded && roleLoaded) {
    if (!user) status = "unauthenticated";
    else if (role === "admin") status = "authorized";
    else status = "forbidden";
  }

  return { status, user, role };
}
