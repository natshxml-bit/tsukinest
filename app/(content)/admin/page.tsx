"use client";
// app/(content)/admin/page.tsx
// Dashboard admin — versi 2:
//  - Ringkasan: total user, online sekarang, admin, user baru minggu ini
//  - Cari & filter user (semua / online / admin / member)
//  - Kelola role langsung dari sini (jadikan admin / turunin ke member)
//  - Email ditampilin tanpa domain biar rapi & gak nge-expose provider mail
//
// Akses dibatasi lewat useAdminGuard() di sisi UI, dan lewat Firestore
// Security Rules di sisi server (lihat firestore.rules di root project).

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
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
  Search,
  X,
  UserPlus,
  Loader2,
  Megaphone,
  Send,
} from "lucide-react";
import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useAdminGuard } from "@/features/admin/hooks/useAdminGuard";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import { setUserRole } from "@/features/admin/services/adminActions";
import { timeAgo, hideEmailDomain } from "@/features/admin/utils";
import type { AdminUserRow, UserRole } from "@/features/admin/types";

type FilterKey = "all" | "online" | "admin" | "member";

// ───────────────────────── Guard screens ─────────────────────────

function CenteredMessage({
  icon: Icon,
  iconClass,
  title,
  message,
  actionHref,
  actionLabel,
  actionClass,
}: {
  icon: ElementType;
  iconClass: string;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
  actionClass: string;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", iconClass)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-base font-bold text-white mb-1">{title}</h1>
        <p className="text-xs text-neutral-500 max-w-xs">{message}</p>
      </div>
      <Link
        href={actionHref}
        className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white", actionClass)}
      >
        {actionHref === "/" && <ArrowLeft className="w-3.5 h-3.5" />}
        {actionLabel}
      </Link>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { status, user } = useAdminGuard();
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
      <CenteredMessage
        icon={LogIn}
        iconClass="bg-white/5 text-neutral-400"
        title="Masuk Dulu, Yuk"
        message="Kamu harus masuk pakai akun admin buat lihat dashboard ini."
        actionHref="/profile"
        actionLabel="Ke Halaman Profil"
        actionClass={accentStyle.bg}
      />
    );
  }

  if (status === "forbidden") {
    return (
      <CenteredMessage
        icon={ShieldAlert}
        iconClass="bg-red-500/10 text-red-400"
        title="Akses Ditolak"
        message="Halaman ini cuma buat admin. Akun kamu belum punya akses ke sini."
        actionHref="/"
        actionLabel="Kembali ke Beranda"
        actionClass="bg-[#1c1c1c] border border-white/[0.05]"
      />
    );
  }

  return <AdminDashboardContent currentUid={user?.uid ?? null} />;
}

// ───────────────────────── Stat cards ─────────────────────────

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
    <div className="bg-[#1c1c1c] rounded-2xl p-4 border border-white/[0.05]">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", accentClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-[11px] text-neutral-500">{label}</p>
    </div>
  );
}

// ───────────────────────── Filter chips ─────────────────────────

function FilterChip({
  active,
  label,
  count,
  onClick,
  accentStyle,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  accentStyle: { bg: string };
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors",
        active ? cn(accentStyle.bg, "text-white") : "bg-[#1c1c1c] text-neutral-400 border border-white/[0.05]"
      )}
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  );
}

// ───────────────────────── User row ─────────────────────────

function UserRow({
  row,
  isSelf,
  confirming,
  pending,
  onToggleRole,
}: {
  row: AdminUserRow;
  isSelf: boolean;
  confirming: boolean;
  pending: boolean;
  onToggleRole: () => void;
}) {
  const initials = (row.displayName || row.email || "?").slice(0, 1).toUpperCase();
  const nextRoleLabel = row.role === "admin" ? "Jadikan Member" : "Jadikan Admin";

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="relative shrink-0">
        {row.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.photoURL}
            alt={row.displayName ?? "User"}
            className={cn(
              "w-11 h-11 rounded-full object-cover ring-2",
              row.online ? "ring-emerald-500/60" : "ring-white/10"
            )}
          />
        ) : (
          <div
            className={cn(
              "w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white ring-2",
              row.online ? "ring-emerald-500/60" : "ring-white/10"
            )}
          >
            {initials}
          </div>
        )}
        {row.online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#1c1c1c]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white truncate">
            {row.displayName || "Tanpa Nama"}
          </p>
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
              row.role === "admin" ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-neutral-400"
            )}
          >
            {row.role === "admin" && <Crown className="w-2.5 h-2.5" />}
            {row.role === "admin" ? "Admin" : "Member"}
          </span>
        </div>

        <p className="text-[11px] text-neutral-500 truncate">{hideEmailDomain(row.email)}</p>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-neutral-600 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {row.online ? (
              <span className="text-emerald-400 font-medium">Online</span>
            ) : (
              timeAgo(row.lastActiveMs)
            )}
          </p>

          {isSelf ? (
            <span className="text-[10px] text-neutral-600 italic">Ini kamu</span>
          ) : (
            <button
              onClick={onToggleRole}
              disabled={pending}
              className={cn(
                "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1",
                confirming
                  ? "bg-red-500/15 text-red-400"
                  : "bg-white/5 text-neutral-400 active:bg-white/10"
              )}
            >
              {pending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : confirming ? (
                "Yakin?"
              ) : (
                nextRoleLabel
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Broadcast ─────────────────────────

type BroadcastItem = {
  id: string;
  title: string;
  message: string;
  slug?: string | null;
  createdAt?: { toMillis?: () => number } | number | null;
};

function BroadcastSection({ accentStyle }: { accentStyle: { bg: string; text: string; soft?: string } }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(10)),
      (snap) => {
        setBroadcasts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BroadcastItem[]);
      },
      (err) => console.error("Broadcast: gagal load announcements:", err)
    );
    return () => unsub();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || sending) return;
    setSending(true);
    setStatus(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Kamu belum login.");

      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        message: message.trim(),
        slug: slug.trim() || null,
        createdBy: { uid: user.uid, displayName: user.displayName ?? null },
        createdAt: serverTimestamp(),
      });

      let pushInfo = "Tersimpan. Push FCM belum terkonfigurasi.";
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ title: title.trim(), message: message.trim(), slug: slug.trim() }),
        });
        let errText = "";
        try {
          const data = await res.json();
          errText = data?.error || (res.ok ? "" : JSON.stringify(data));
        } catch {
          errText = `HTTP ${res.status} (respon bukan JSON)`;
        }
        pushInfo = res.ok ? "Push terkirim ke semua perangkat APK." : `Push gagal: ${errText}`;
      } catch (err) {
        pushInfo = `Push gagal (network): ${err instanceof Error ? err.message : String(err)}`;
      }

      setTitle(""); setMessage(""); setSlug("");
      setStatus({ type: "success", text: `Broadcast terkirim. ${pushInfo}` });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Gagal broadcast." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 mb-5">
      <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.05] p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-white/5">
            <Megaphone className={cn("w-4 h-4", accentStyle.text)} />
          </div>
          <span className="text-sm font-bold text-white">Broadcast Notifikasi</span>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          Kirim pengumuman ke semua user (muncul di popup notif + push APK).
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul, mis. Update Chapter Baru!"
          maxLength={80}
          className="w-full bg-[#141414] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white/20 mb-2"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Isi pesan pengumuman..."
          rows={3}
          maxLength={300}
          className="w-full bg-[#141414] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white/20 mb-2 resize-none"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug manga (opsional), mis. eleceed"
          className="w-full bg-[#141414] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white/20 mb-3"
        />

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]",
            accentStyle.bg,
            (sending || !title.trim() || !message.trim()) && "opacity-50 cursor-not-allowed"
          )}
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? "Mengirim..." : "Kirim Broadcast"}
        </button>

        {status && (
          <p className={cn(
            "mt-2.5 text-[11px] font-medium",
            status.type === "success" ? "text-emerald-400" : "text-red-400"
          )}>
            {status.text}
          </p>
        )}

        {broadcasts.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Riwayat Broadcast</p>
            {broadcasts.map((b) => (
              <div key={b.id} className="bg-[#141414] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-xs font-semibold text-white">{b.title}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{b.message}</p>
                <p className="text-[10px] text-neutral-600 mt-1">
                  {b.createdAt && typeof (b.createdAt as { toMillis?: () => number }).toMillis === "function"
                    ? timeAgo((b.createdAt as { toMillis: () => number }).toMillis())
                    : timeAgo(null)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Main content ─────────────────────────

function AdminDashboardContent({ currentUid }: { currentUid: string | null }) {
  const { users, stats, loading, error } = useAdminUsers();
  const { style: accentStyle } = useAccent();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = users;
    if (filter === "online") list = list.filter((u) => u.online);
    else if (filter === "admin") list = list.filter((u) => u.role === "admin");
    else if (filter === "member") list = list.filter((u) => u.role === "member");

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.displayName ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  async function handleToggleRole(row: AdminUserRow) {
    if (pendingUid) return;

    if (confirmUid !== row.uid) {
      setConfirmUid(row.uid);
      window.setTimeout(() => {
        setConfirmUid((c) => (c === row.uid ? null : c));
      }, 3000);
      return;
    }

    const nextRole: UserRole = row.role === "admin" ? "member" : "admin";
    setPendingUid(row.uid);
    try {
      await setUserRole(row.uid, nextRole);
    } catch (err) {
      console.error("Gagal ubah role user:", err);
    } finally {
      setPendingUid(null);
      setConfirmUid(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn("w-4 h-4", accentStyle.text)} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium text-neutral-500">Live</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={Users} label="Total User" value={stats.total} accentClass={cn(accentStyle.soft, accentStyle.text)} />
        <StatCard icon={Radio} label="Online Sekarang" value={stats.online} accentClass="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={Crown} label="Admin" value={stats.admins} accentClass="bg-amber-500/10 text-amber-400" />
        <StatCard icon={UserPlus} label="Baru (7 Hari)" value={stats.newThisWeek} accentClass="bg-sky-500/10 text-sky-400" />
      </div>

      {/* Broadcast */}
      <BroadcastSection accentStyle={accentStyle} />

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full bg-[#1c1c1c] border border-white/[0.05] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        <FilterChip active={filter === "all"} label="Semua" count={stats.total} onClick={() => setFilter("all")} accentStyle={accentStyle} />
        <FilterChip active={filter === "online"} label="Online" count={stats.online} onClick={() => setFilter("online")} accentStyle={accentStyle} />
        <FilterChip active={filter === "admin"} label="Admin" count={stats.admins} onClick={() => setFilter("admin")} accentStyle={accentStyle} />
        <FilterChip active={filter === "member"} label="Member" count={stats.members} onClick={() => setFilter("member")} accentStyle={accentStyle} />
      </div>

      {/* User list */}
      <div className="px-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 mb-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-[#1c1c1c] animate-pulse border border-white/[0.05]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1c1c1c] rounded-2xl p-6 text-center border border-white/[0.05]">
            <p className="text-xs text-neutral-500">
              {users.length === 0 ? "Belum ada user tercatat." : "Gak ada user yang cocok."}
            </p>
          </div>
        ) : (
          <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.05] overflow-hidden">
            {filtered.map((row) => (
              <UserRow
                key={row.uid}
                row={row}
                isSelf={row.uid === currentUid}
                confirming={confirmUid === row.uid}
                pending={pendingUid === row.uid}
                onToggleRole={() => handleToggleRole(row)}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}