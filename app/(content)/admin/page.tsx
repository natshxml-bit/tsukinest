"use client";
// app/(content)/admin/page.tsx
// Dashboard admin: total user, berapa yang online sekarang, dan daftar
// user beserta role-nya. Akses dibatasi lewat useAdminGuard() di sisi UI,
// dan lewat Firestore Security Rules di sisi server (firestore.rules).

import Link from "next/link";
import type { ElementType } from "react";
import {
  Users,
  Radio,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  ArrowLeft,
  Crown,
  Clock,
} from "lucide-react";
import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { useAdminGuard } from "@/features/admin/hooks/useAdminGuard";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import type { AdminUserRow } from "@/features/admin/types";

function timeAgo(ms: number | null): string {
  if (!ms) return "Belum pernah aktif";
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: ElementType;
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <div className="bg-[#1c1c1c] rounded-2xl p-4 border border-white/[0.05] flex-1 min-w-[100px]">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", accentClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-[11px] text-neutral-500">{label}</p>
    </div>
  );
}

function UserRow({ row }: { row: AdminUserRow }) {
  const initials = (row.displayName || row.email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="relative shrink-0">
        {row.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.photoURL}
            alt={row.displayName ?? "User"}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
            {initials}
          </div>
        )}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1c1c1c]",
            row.online ? "bg-emerald-500" : "bg-neutral-600"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">
          {row.displayName || "Tanpa Nama"}
        </p>
        <p className="text-[11px] text-neutral-500 truncate">{row.email || "-"}</p>
      </div>
      <div className="text-right shrink-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-1",
            row.role === "admin" ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-neutral-400"
          )}
        >
          {row.role === "admin" && <Crown className="w-2.5 h-2.5" />}
          {row.role === "admin" ? "Admin" : "Member"}
        </span>
        <p className="text-[10px] text-neutral-500 flex items-center gap-1 justify-end">
          <Clock className="w-2.5 h-2.5" />
          {row.online ? "Online" : timeAgo(row.lastActiveMs)}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { status } = useAdminGuard();
  const { style: accentStyle } = useAccent();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
        <p className="text-xs text-neutral-500">Memeriksa akses...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
          <LogIn className="w-6 h-6 text-neutral-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white mb-1">Masuk Dulu, Yuk</h1>
          <p className="text-xs text-neutral-500 max-w-xs">
            Kamu harus masuk pakai akun admin buat lihat dashboard ini.
          </p>
        </div>
        <Link
          href="/profile"
          className={cn("px-5 py-2.5 rounded-xl text-xs font-bold text-white", accentStyle.bg)}
        >
          Ke Halaman Profil
        </Link>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white mb-1">Akses Ditolak</h1>
          <p className="text-xs text-neutral-500 max-w-xs">
            Halaman ini cuma buat admin. Akun kamu belum punya akses ke sini.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1c1c1c] border border-white/[0.05]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const { users, stats, loading, error } = useAdminUsers();
  const { style: accentStyle } = useAccent();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className={cn("w-4 h-4", accentStyle.text)} />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
            Admin
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>

      <div className="px-4 flex gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Total User"
          value={stats.total}
          accentClass={cn(accentStyle.soft, accentStyle.text)}
        />
        <StatCard
          icon={Radio}
          label="Online Sekarang"
          value={stats.online}
          accentClass="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          icon={Crown}
          label="Admin"
          value={stats.admins}
          accentClass="bg-amber-500/10 text-amber-400"
        />
      </div>

      <div className="px-4">
        <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-3">
          Semua User ({stats.total})
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 mb-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-[#1c1c1c] animate-pulse border border-white/[0.05]"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-[#1c1c1c] rounded-2xl p-6 text-center border border-white/[0.05]">
            <p className="text-xs text-neutral-500">Belum ada user tercatat.</p>
          </div>
        ) : (
          <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.05] overflow-hidden">
            {users.map((row) => (
              <UserRow key={row.uid} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
