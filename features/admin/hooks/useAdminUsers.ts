"use client";
// features/admin/hooks/useAdminUsers.ts
// Data realtime semua user buat dashboard admin: daftar user, total,
// dan berapa yang lagi online. Cuma boleh dipanggil setelah lolos
// useAdminGuard (Firestore Rules juga nolak query ini kalau bukan admin).

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ONLINE_THRESHOLD_MS } from "@/lib/userSync";
import type { AdminUserRow, UserRole } from "@/features/admin/types";

interface RawUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAtMs: number | null;
  lastActiveMs: number | null;
}

export function useAdminUsers() {
  const [rawUsers, setRawUsers] = useState<RawUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const rows: RawUser[] = snap.docs.map((d) => {
          const data = d.data() as {
            email?: string | null;
            displayName?: string | null;
            photoURL?: string | null;
            role?: UserRole;
            createdAt?: Timestamp;
            lastActive?: Timestamp;
          };
          return {
            uid: d.id,
            email: data.email ?? null,
            displayName: data.displayName ?? null,
            photoURL: data.photoURL ?? null,
            role: data.role === "admin" ? "admin" : "member",
            createdAtMs: data.createdAt ? data.createdAt.toMillis() : null,
            lastActiveMs: data.lastActive ? data.lastActive.toMillis() : null,
          };
        });
        setRawUsers(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useAdminUsers: gagal ambil data user:", err);
        setError(
          "Gagal memuat data user. Kemungkinan Firestore Rules belum di-deploy."
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Detak tiap 15 detik biar status "online" ke-refresh walau gak ada
  // perubahan data baru dari Firestore (soalnya online itu relatif waktu).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const users: AdminUserRow[] = useMemo(() => {
    return rawUsers
      .map((u) => ({
        ...u,
        online: u.lastActiveMs ? now - u.lastActiveMs < ONLINE_THRESHOLD_MS : false,
      }))
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return (b.lastActiveMs ?? 0) - (a.lastActiveMs ?? 0);
      });
  }, [rawUsers, now]);

  const stats = useMemo(() => {
    const total = users.length;
    const online = users.filter((u) => u.online).length;
    const admins = users.filter((u) => u.role === "admin").length;
    return { total, online, admins, members: total - admins };
  }, [users]);

  return { users, stats, loading, error };
}
