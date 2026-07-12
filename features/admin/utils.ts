// features/admin/utils.ts
// Helper format tampilan buat dashboard admin.

export function timeAgo(ms: number | null): string {
  if (!ms) return "Belum pernah aktif";
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return `${Math.floor(d / 30)} bulan lalu`;
}

export function joinedLabel(ms: number | null): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Buang domain email (misal "budi@gmail.com" -> "budi") biar tampilan
 * dashboard lebih rapi & gak nampilin provider email orang mentah-mentah.
 * Dipakai cuma buat DISPLAY, bukan buat identifikasi (tetep pakai uid).
 */
export function hideEmailDomain(email: string | null): string {
  if (!email) return "Tanpa email";
  const at = email.indexOf("@");
  if (at === -1) return email;
  return email.slice(0, at);
}