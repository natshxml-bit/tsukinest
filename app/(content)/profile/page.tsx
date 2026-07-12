"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import Link from "next/link";
import { auth, db, signInWithGoogle } from "@/lib/firebase"; 
import {
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { collection, getDocs, doc, onSnapshot, getCountFromServer } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { clearCache } from "@/lib/api";
import {
  Camera,
  Pencil,
  Copy,
  Calendar,
  BookOpen,
  Clock,
  Settings,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  LogOut,
  Download,
  Sparkles,
  Check,
  RotateCcw,
  UserCircle2,
  Shield,
  Palette,
  Zap,
  HardDrive,
  UserCog,
  LayoutDashboard,
  Bookmark,
  Heart,
  Crown,
  Mail,
} from "lucide-react";

import Cropper from "react-easy-crop";
import { useAccent } from "@/lib/accent";

// ═══════════════════════════════════════════════════
// TYPES & UTILS
// ═══════════════════════════════════════════════════

type ReadingHistory = {
  slug: string;
  title: string;
  chapter: string;
  thumb: string;
  timestamp: number;
};

type ToastItem = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg");
  });
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

const IconGoogle = memo(({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
));

function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-5 p-4 relative overflow-hidden">
      <div className="w-28 h-28 rounded-full bg-[#1c1c1c] animate-pulse ring-1 ring-white/[0.08]" />
      <div className="w-48 h-6 rounded-full bg-[#1c1c1c] animate-pulse" />
      <div className="w-32 h-4 rounded-md bg-[#1c1c1c] animate-pulse" />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

export default function ProfilePage() {
  const { accent, style: accentStyle, setAccent, customHex, setCustomHex } = useAccent();

  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    variant?: "danger" | "default";
    onConfirm: () => void;
  }>({ show: false, title: "", message: "", onConfirm: () => {} });

  const [promptModal, setPromptModal] = useState<{
    show: boolean;
    title: string;
    placeholder: string;
    value: string;
    isPassword?: boolean;
    onConfirm: (val: string) => void;
  }>({ show: false, title: "", placeholder: "", value: "", onConfirm: () => {} });

  const triggerToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLocalPhoto(u?.photoURL || null);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Baca role user (admin/member) buat nampilin link Dashboard Admin
  // kalau relevan. Dokumennya sendiri dibuat otomatis oleh <PresenceTracker />.
  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setRole((snap.data()?.role as string) ?? "member");
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    const fetchHistoryFromFirebase = async () => {
      try {
        const historyRef = collection(db, "users", user.uid, "history");
        const querySnapshot = await getDocs(historyRef);
        const historyData: ReadingHistory[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          historyData.push({
            slug: data.slug || doc.id,
            title: data.title || "Tanpa Judul",
            chapter: data.lastReadChapter || "",
            thumb: data.thumb || "",
            timestamp: data.savedAt || 0,
          });
        });
        historyData.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(historyData);
      } catch (error) {
        console.error("Gagal ngambil history:", error);
      }
    };
    fetchHistoryFromFirebase();
  }, [user]);

  // Jumlah bookmark & like buat kartu stats. Pake getCountFromServer biar
  // gak perlu download semua dokumen cuma buat ngitung jumlahnya.
  useEffect(() => {
    if (!user) {
      setBookmarkCount(null);
      setLikeCount(null);
      return;
    }
    (async () => {
      try {
        const [bookmarkSnap, likeSnap] = await Promise.all([
          getCountFromServer(collection(db, "users", user.uid, "bookmarks")),
          getCountFromServer(collection(db, "users", user.uid, "likes")),
        ]);
        setBookmarkCount(bookmarkSnap.data().count);
        setLikeCount(likeSnap.data().count);
      } catch (error) {
        console.error("Gagal ngambil jumlah bookmark/like:", error);
        setBookmarkCount(0);
        setLikeCount(0);
      }
    })();
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        triggerToast("Selamat datang kembali!", "success");
      }
    } catch (error: any) {
      console.error("Login Google Error:", error);
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.message !== "12501: " && // Kode cancel native Android
        !error.message?.includes("canceled")
      ) {
        triggerToast("Gagal masuk dengan Google.", "error");
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      triggerToast("Email/password tidak valid.", "error");
      return;
    }
    try {
      if (isRegisterMode) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (res.user) {
          await updateProfile(res.user, { displayName: displayName || "Pembaca Tsuki" });
          setUser({ ...res.user, displayName: displayName || "Pembaca Tsuki" } as User);
        }
        triggerToast("Akun berhasil dibuat!", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        triggerToast("Berhasil masuk.", "success");
      }
      setEmail(""); setPassword(""); setDisplayName("");
    } catch (error: any) {
      const msg = error.code === "auth/email-already-in-use" ? "Email sudah terdaftar." : error.code === "auth/wrong-password" ? "Kata sandi salah." : error.code === "auth/user-not-found" ? "Email belum terdaftar." : "Terjadi kesalahan.";
      triggerToast(msg, "error");
    }
  };

  const handleEditName = () => {
    if (!user) return;
    setPromptModal({
      show: true,
      title: "Ubah Nama Profil",
      placeholder: "Masukkan nama baru...",
      value: user.displayName || "",
      onConfirm: async (newName) => {
        if (!newName.trim()) { triggerToast("Nama tidak boleh kosong.", "error"); return; }
        try {
          await updateProfile(user, { displayName: newName.trim() });
          setUser({ ...user, displayName: newName.trim() } as User);
          setPromptModal((prev) => ({ ...prev, show: false }));
          triggerToast("Nama berhasil diubah!", "success");
        } catch { triggerToast("Gagal memperbarui nama.", "error"); }
      },
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { triggerToast("File harus gambar.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { triggerToast("Maksimal 5MB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewImage(ev.target?.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDropPreview: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const confirmUpload = async () => {
    if (!previewImage || !croppedAreaPixels || !user) return;
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(previewImage, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Gagal memotong gambar");
      const croppedFile = new File([croppedBlob], `profile_${Date.now()}.jpg`, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("image", croppedFile);
      const imgbbKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
      if (!imgbbKey) throw new Error("No API key");
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const url = data.data.display_url;
        await updateProfile(user, { photoURL: url });
        setLocalPhoto(url);
        triggerToast("Foto profil diperbarui.", "success");
      } else throw new Error("Upload failed");
    } catch {
      triggerToast("Gagal mengunggah foto.", "error");
    } finally {
      setIsUploading(false);
      setPreviewImage(null);
    }
  };

  const cancelUpload = () => setPreviewImage(null);

  const setDefaultAvatar = async (seed: string) => {
    if (!user) return;
    const url = `https://ui-avatars.com/api/?name=${seed}&background=${accentStyle.hex.replace("#", "")}&color=fff&size=256`;
    try {
      await updateProfile(user, { photoURL: url });
      setLocalPhoto(url);
      setShowAvatarPicker(false);
      triggerToast("Avatar diperbarui.", "success");
    } catch {
      triggerToast("Gagal mengganti avatar.", "error");
    }
  };

  const handleClearCache = () => {
    setConfirmModal({
      show: true,
      title: "Bersihkan Cache",
      message: "Semua data cache akan dihapus. History bacaan tetap tersimpan.",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
        try {
          const res = await clearCache();
          triggerToast(res?.success ? "Cache dibersihkan." : "Gagal membersihkan cache.", res?.success ? "success" : "error");
        } catch { triggerToast("Gagal membersihkan cache.", "error"); }
      },
    });
  };

  const handleResetPassword = () => {
    if (!user?.email) return;
    setConfirmModal({
      show: true,
      title: "Atur Ulang Kata Sandi",
      message: `Kirim tautan ke ${user.email}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
        try {
          await sendPasswordResetEmail(auth, user.email!);
          triggerToast("Tautan terkirim! Cek inbox/spam.", "success");
        } catch { triggerToast("Gagal mengirim tautan.", "error"); }
      },
    });
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    setConfirmModal({
      show: true,
      variant: "danger",
      title: "Hapus Akun Permanen",
      message: "Semua data akun akan dihapus dan tidak bisa dikembalikan. Lanjutkan?",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, show: false }));
        if (user.providerData[0]?.providerId === "password" && user.email) {
          setPromptModal({
            show: true,
            title: "Konfirmasi Kata Sandi",
            placeholder: "Masukkan password untuk konfirmasi",
            value: "",
            isPassword: true,
            onConfirm: async (pass) => {
              try {
                const credential = EmailAuthProvider.credential(user.email!, pass);
                await reauthenticateWithCredential(user, credential);
                await deleteUser(user);
                setHistory([]);
                setPromptModal((prev) => ({ ...prev, show: false }));
                triggerToast("Akun dihapus.", "info");
              } catch { triggerToast("Password salah atau gagal menghapus.", "error"); }
            },
          });
        } else {
          try {
            await deleteUser(user);
            setHistory([]);
            triggerToast("Akun dihapus.", "info");
          } catch { triggerToast("Gagal menghapus. Coba login ulang.", "error"); }
        }
      },
    });
  };

  const handleLogout = () => {
    setConfirmModal({
      show: true,
      title: "Keluar Akun",
      message: "Yakin mau keluar?",
      onConfirm: async () => {
        await signOut(auth);
        setLocalPhoto(null);
        setIsSettingsOpen(false);
        setConfirmModal((prev) => ({ ...prev, show: false }));
        triggerToast("Berhasil keluar.", "info");
      },
    });
  };

  const copyUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      triggerToast("UID disalin!", "success");
    } catch { triggerToast("Gagal menyalin.", "error"); }
  };

  const joinDate = user?.metadata?.creationTime ? formatDate(new Date(user.metadata.creationTime).getTime()) : "-";

  if (isLoading) return <SkeletonProfile />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28 relative overflow-x-hidden selection:bg-white/10">

      {/* ── TOAST QUEUE ── */}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 max-w-sm w-full transition-all duration-500 translate-y-0 bg-[#1c1c1c] text-white",
              t.type === "success" && "border-emerald-500/30",
              t.type === "error" && "border-red-500/30",
              t.type === "info" && "border-blue-500/30"
            )}
          >
            <span className="text-lg">{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
            <p className="text-xs font-semibold leading-tight">{t.message}</p>
          </div>
        ))}
      </div>

      {/* ── HEADER ── */}
      <div className="max-w-md mx-auto px-5 pt-8 pb-4 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className={cn(
            "p-2.5 rounded-2xl border shadow-lg backdrop-blur-md bg-[#1c1c1c] border-white/[0.05]",
          )}>
            <UserCircle2 className={cn("w-5 h-5", accentStyle.text)} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
            <p className="text-[11px] text-gray-500 font-medium">Kelola akun dan preferensi</p>
          </div>
        </div>
      </div>

      {/* ── CONDITIONAL RENDER: LOGGED IN VS LOGGED OUT ── */}
      {user ? (
        <div className="max-w-md mx-auto px-5 space-y-8 relative z-10">
          {/* ── AVATAR ── */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "relative mb-5 rounded-full p-[3px] transition-all duration-300",
                dragOver ? cn(accentStyle.border, "scale-105") : "border-transparent"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropPreview}
            >
              <div
                className="absolute -inset-2 rounded-full opacity-30 blur-xl pointer-events-none"
                style={{ background: accentStyle.hex }}
              />
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#1c1c1c] relative ring-1 ring-white/[0.06]">
                <img
                  src={localPhoto || `https://ui-avatars.com/api/?name=${user.displayName || "U"}&background=1A1A24&color=fff`}
                  alt="Profile"
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-110"
                />
              </div>

              <input type="file" accept="image/*" id="upload-pp" className="hidden" onChange={handleFileSelect} />
              <label
                htmlFor="upload-pp"
                className={cn(
                  "absolute bottom-1 right-1 p-2.5 rounded-full border-2 border-[#0a0a0a] shadow-xl transition-all active:scale-90 z-10 cursor-pointer hover:brightness-125 hover:scale-110", 
                  accentStyle.bg
                )}
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
            </div>

            <button
              onClick={() => setShowAvatarPicker((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors mb-2 px-3 py-1 rounded-full bg-[#1c1c1c] border border-white/[0.05]"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              Pilih avatar default
            </button>

            {showAvatarPicker && (
              <div className="flex gap-2.5 mt-2 mb-2 overflow-x-auto max-w-full pb-2 scrollbar-hide px-2">
                {["Asta", "Naruto", "Luffy", "Goku", "Saitama", "Levi", "Zenitsu", "Gojo"].map((seed) => (
                  <button
                    key={seed}
                    onClick={() => setDefaultAvatar(seed)}
                    className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden border border-white/[0.08] hover:border-white/30 transition-all active:scale-90"
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${seed}&background=${accentStyle.hex.replace("#", "")}&color=fff&size=128`}
                      alt={seed}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-1 mt-1">
              <h3 className="text-xl font-bold tracking-tight">{user.displayName || "Pembaca Tsuki"}</h3>
              <button onClick={handleEditName} className="text-gray-500 hover:text-white transition-all p-1.5 rounded-xl hover:bg-white/5 active:scale-90">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {role === "admin" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wide">
                  <Crown className="w-3 h-3" /> Admin
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span className="truncate max-w-[180px]">{user.email}</span>
              {user.emailVerified && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/[0.1] text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Terverifikasi
                </span>
              )}
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/[0.05] text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                {user.providerData[0]?.providerId === "google.com" ? (
                  <IconGoogle className="w-3 h-3" />
                ) : (
                  <Mail className="w-3 h-3" />
                )}
              </span>
            </div>

            <p className="text-[11px] text-neutral-600 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Bergabung {joinDate}
            </p>

            <button
              onClick={copyUid}
              className="mt-1 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1c1c1c] border border-white/[0.05] hover:bg-[#262626] transition-all active:scale-95 group"
            >
              <span className="text-[11px] text-gray-500 font-mono tracking-tight">{user.uid.slice(0, 14)}...</span>
              <Copy className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-3 gap-2.5">
            <Link
              href="/library"
              className="group relative overflow-hidden bg-[#141414] border border-white/[0.05] rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[92px] gap-1.5 transition-all hover:border-white/10 active:scale-[0.97]"
            >
              <Clock className={cn("w-4.5 h-4.5", accentStyle.text)} />
              <div className="text-base font-bold text-white leading-none">{history.length}</div>
              <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Riwayat</div>
            </Link>
            <Link
              href="/library"
              className="group relative overflow-hidden bg-[#141414] border border-white/[0.05] rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[92px] gap-1.5 transition-all hover:border-white/10 active:scale-[0.97]"
            >
              <Bookmark className="w-4.5 h-4.5 text-sky-400" />
              <div className="text-base font-bold text-white leading-none">
                {bookmarkCount ?? <span className="inline-block w-4 h-3 bg-white/10 rounded animate-pulse" />}
              </div>
              <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Bookmark</div>
            </Link>
            <Link
              href="/library"
              className="group relative overflow-hidden bg-[#141414] border border-white/[0.05] rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[92px] gap-1.5 transition-all hover:border-white/10 active:scale-[0.97]"
            >
              <Heart className="w-4.5 h-4.5 text-rose-400" />
              <div className="text-base font-bold text-white leading-none">
                {likeCount ?? <span className="inline-block w-4 h-3 bg-white/10 rounded animate-pulse" />}
              </div>
              <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Disukai</div>
            </Link>
          </div>

          {/* ── RECENT HISTORY ── */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" /> Terakhir Dibaca
                </h4>
                <button
                  onClick={() => setHistory([])}
                  className="text-[10px] text-red-400/80 hover:text-red-300 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-red-500/10"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-hide -mx-5 px-5">
                {history.slice(0, 10).map((h) => (
                  <a key={`${h.slug}-${h.timestamp}`} href={`/manga/${h.slug}`} className="flex-shrink-0 w-[115px] group">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1c1c1c] border border-white/[0.05] mb-2.5 transition-all group-hover:-translate-y-1 duration-300">
                      <img src={h.thumb || "/no-image.png"} alt={h.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-md">{h.chapter}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-snug group-hover:text-white transition-colors font-medium">{h.title}</p>
                    <p className="text-[9px] text-neutral-600 mt-1">{timeAgo(h.timestamp)}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── MAIN MENU ── */}
          <div className="bg-[#141414] border border-white/[0.05] rounded-3xl overflow-hidden">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1c1c1c] transition-all text-left group active:scale-[0.99] duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className={cn("p-2 rounded-xl bg-white/5")}>
                  <Settings className={cn("w-4 h-4 text-neutral-400")} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium group-hover:text-white transition-colors">Pengaturan Akun</span>
                  <span className="text-[10px] text-gray-500">Warna, privasi, dan data</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-all group-hover:translate-x-0.5" />
            </button>

            <div className="h-px bg-white/[0.04] mx-4" />

            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1c1c1c] transition-all text-left group active:scale-[0.99] duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-orange-500/10">
                  <Trash2 className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Bersihkan Cache</span>
                  <span className="text-[10px] text-gray-500">Hapus data sementara</span>
                </div>
              </div>
              <Trash2 className="w-4 h-4 text-gray-700" />
            </button>

            <div className="h-px bg-white/[0.04] mx-4" />

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/[0.05] transition-all text-left group active:scale-[0.99] duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-red-400/90 group-hover:text-red-300 transition-colors">Hapus Akun</span>
                  <span className="text-[10px] text-gray-500">Tindakan permanen</span>
                </div>
              </div>
              <AlertTriangle className="w-4 h-4 text-red-500/30" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-[#1c1c1c] text-red-400 border border-white/[0.05] py-3.5 rounded-2xl font-bold hover:bg-[#262626] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </button>

          <div className="text-center pt-2 pb-4">
            <span className="text-[10px] text-neutral-600 tracking-[0.2em] font-bold uppercase">Tsukinest v1.2.0</span>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto px-5 relative z-10 pt-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center mb-5 border bg-[#141414] border-white/[0.05]"
            )}>
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 tracking-tight">{isRegisterMode ? "Daftar Akun" : "Selamat Datang"}</h3>
            <p className="text-xs text-neutral-500 px-8 leading-relaxed max-w-[280px]">
              {isRegisterMode ? "Buat akun untuk sinkronisasi data bacaan di semua perangkat." : "Masuk untuk menyimpan history, koleksi, dan preferensi."}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="w-full space-y-3.5 mb-6">
            {isRegisterMode && (
              <div className="relative group">
                <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Nama lengkap..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/[0.05] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-white/20 transition-all placeholder:text-neutral-600"
                  required
                />
              </div>
            )}
            <div className="relative group">
              <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
              <input
                type="email"
                placeholder="Email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.05] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-white/20 transition-all placeholder:text-neutral-600"
                required
              />
            </div>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kata sandi (min. 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141414] border border-white/[0.05] rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white outline-none focus:border-white/20 transition-all placeholder:text-neutral-600"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors p-1.5 rounded-lg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold active:scale-[0.98] transition-all text-sm mt-2 text-white",
                accentStyle.bg
              )}
            >
              {isRegisterMode ? "Daftar Sekarang" : "Masuk"}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-500 mb-6">
            {isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <span
              onClick={() => { setIsRegisterMode(!isRegisterMode); setEmail(""); setPassword(""); setDisplayName(""); }}
              className={cn("font-bold cursor-pointer hover:underline transition-all", accentStyle.text)}
            >
              {isRegisterMode ? "Masuk" : "Daftar"}
            </span>
          </p>

          {/* ═══════════════════════════════════════════════
              TOMBOL GOOGLE SEKARANG MUNCUL DI WEB DAN APK 🚀
              ═══════════════════════════════════════════════ */}
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-[10px] text-neutral-600 font-bold tracking-widest uppercase">
                atau
              </span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-sm"
            >
              <IconGoogle />
              Lanjutkan dengan Google
            </button>
          </>

        </div>
      )}

      {/* IMAGE CROP MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#141414] border border-white/[0.05] w-full max-w-sm rounded-3xl p-6 text-center">
            <h3 className="text-lg font-bold mb-1">Sesuaikan Foto</h3>
            <p className="text-xs text-neutral-500 mb-5">Geser dan perbesar biar pas di tengah</p>

            <div className="relative w-full h-64 mb-5 rounded-2xl overflow-hidden bg-black/40 border border-white/[0.05]">
              <Cropper
                image={previewImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="mb-6 px-2 flex items-center gap-3">
              <span className="text-xs font-bold text-neutral-600">-</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
              />
              <span className="text-xs font-bold text-neutral-600">+</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelUpload}
                disabled={isUploading}
                className="flex-1 bg-[#1c1c1c] hover:bg-[#262626] py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Batal
              </button>
              <button
                onClick={confirmUpload}
                disabled={isUploading}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 text-white flex items-center justify-center gap-1.5",
                  accentStyle.bg,
                  isUploading && "opacity-70 cursor-wait"
                )}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isUploading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          SETTINGS SHEET
          ═══════════════════════════════════════════════ */}
      {isSettingsOpen && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md">
          <div
            className="bg-[#141414] w-full sm:w-[440px] sm:rounded-3xl rounded-t-3xl border border-white/[0.05] max-h-[90vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-xl z-10 flex items-center justify-between p-5 border-b border-white/[0.05]">
              <h3 className="text-base font-bold flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/5">
                  <Settings className="w-4 h-4 text-neutral-300" />
                </div>
                Pengaturan
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors active:scale-90"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="p-5 space-y-8">
              {/* Tampilan */}
              <section>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Tampilan
                </h4>
                <div className="space-y-4">
                  <div className="bg-[#1c1c1c] rounded-2xl p-5 border border-white/[0.05]">
                    <div className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
                      <Sparkles className={cn("w-4 h-4", accentStyle.text)} /> Warna Aksen
                    </div>
                    
                    <div className="grid grid-cols-6 gap-3">
                      <label
                        className={cn(
                          "relative aspect-square rounded-xl border-2 transition-all active:scale-90 flex items-center justify-center overflow-hidden cursor-pointer",
                          accent === "custom"
                            ? "border-white scale-105"
                            : "border-transparent opacity-70 hover:opacity-100"
                        )}
                        style={{
                          background: accent === "custom" ? customHex : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                        }}
                        title="Warna Kustom"
                      >
                        <input
                          type="color"
                          value={customHex}
                          onChange={(e) => {
                            setCustomHex(e.target.value);
                            setAccent("custom");
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-[150%] h-[150%] -ml-1 -mt-1"
                        />
                        {accent === "custom" && <Check className="w-5 h-5 text-white drop-shadow-md z-10 pointer-events-none" />}
                      </label>

                      {([
                        { key: "purple",  bg: "bg-indigo-500" },
                        { key: "violet",  bg: "bg-violet-500" },
                        { key: "sky",     bg: "bg-sky-500" },
                        { key: "cyan",    bg: "bg-teal-500" },
                        { key: "rose",    bg: "bg-rose-500" },
                        { key: "emerald", bg: "bg-emerald-500" },
                        { key: "amber",   bg: "bg-amber-500" },
                        { key: "pink",    bg: "bg-pink-500" },
                        { key: "blue",    bg: "bg-blue-500" },
                        { key: "indigo",  bg: "bg-indigo-600" },
                        { key: "lime",    bg: "bg-lime-500" },
                        { key: "orange",  bg: "bg-orange-500" },
                        { key: "teal",    bg: "bg-teal-600" },
                        { key: "red",     bg: "bg-red-500" },
                        { key: "slate",   bg: "bg-slate-600" },
                        { key: "gold",    bg: "bg-yellow-500" },
                        { key: "mint",    bg: "bg-emerald-400" },
                        { key: "charcoal",bg: "bg-gray-700" },
                        { key: "sea",     bg: "bg-blue-800" },
                      ] as { key: any; bg: string }[]).map((c) => (
                        <button
                          key={c.key}
                          onClick={() => setAccent(c.key)}
                          className={cn(
                            "aspect-square rounded-xl border-2 transition-all active:scale-90 flex items-center justify-center",
                            c.bg,
                            accent === c.key 
                              ? "border-white scale-105" 
                              : "border-transparent opacity-70 hover:opacity-100"
                          )}
                          aria-label={`Accent ${c.key}`}
                        >
                          {accent === c.key && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1c1c1c] rounded-2xl p-5 border border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5">
                        <Zap className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white block">Mode Hemat</span>
                        <span className="text-[11px] text-neutral-500">Kurangi animasi transisi</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={(e) => {
                          document.documentElement.classList.toggle("reduce-motion", e.target.checked);
                        }}
                      />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                    </label>
                  </div>
                </div>
              </section>

              {/* Akun */}
              <section>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <UserCog className="w-3 h-3" /> Akun
                </h4>
                <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.05] overflow-hidden">
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#262626] transition-all text-left active:scale-[0.99]"
                    >
                      <span className="text-sm flex items-center gap-3 text-neutral-300">
                        <LayoutDashboard className="w-4 h-4 text-neutral-500" /> Dashboard Admin
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </Link>
                  )}
                  <button
                    onClick={() => { setIsSettingsOpen(false); handleEditName(); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#262626] transition-all text-left active:scale-[0.99]"
                  >
                    <span className="text-sm flex items-center gap-3 text-neutral-300">
                      <Pencil className="w-4 h-4 text-neutral-500" /> Ubah Nama Profil
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => { setIsSettingsOpen(false); handleResetPassword(); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#262626] transition-all text-left active:scale-[0.99]"
                  >
                    <span className="text-sm flex items-center gap-3 text-neutral-300">
                      <Shield className="w-4 h-4 text-neutral-500" /> Atur Ulang Kata Sandi
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
              </section>

              {/* Data */}
              <section>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <HardDrive className="w-3 h-3" /> Data
                </h4>
                <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.05] overflow-hidden">
                  <button
                    onClick={() => {
                      const data = JSON.stringify(history, null, 2);
                      const blob = new Blob([data], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `tsukinest-backup-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      triggerToast("Backup diunduh!", "success");
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#262626] transition-all text-left active:scale-[0.99]"
                  >
                    <span className="text-sm flex items-center gap-3 text-neutral-300">
                      <Download className="w-4 h-4 text-neutral-500" /> Export History
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => { setIsSettingsOpen(false); handleClearCache(); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#262626] transition-all text-left active:scale-[0.99]"
                  >
                    <span className="text-sm flex items-center gap-3 text-neutral-300">
                      <Trash2 className="w-4 h-4 text-neutral-500" /> Bersihkan Cache
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          CONFIRM MODAL
          ═══════════════════════════════════════════════ */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-white/[0.05] w-full max-w-xs rounded-3xl p-6 text-center">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
              confirmModal.variant === "danger" ? "bg-red-500/10" : "bg-white/5"
            )}>
              {confirmModal.variant === "danger" 
                ? <AlertTriangle className="w-6 h-6 text-red-400" />
                : <Sparkles className={cn("w-6 h-6", accentStyle.text)} />
              }
            </div>
            <h3 className={cn("text-lg font-bold mb-2", confirmModal.variant === "danger" ? "text-red-400" : "text-white")}>
              {confirmModal.title}
            </h3>
            <p className="text-xs text-neutral-400 mb-7 leading-relaxed px-1">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 bg-[#1c1c1c] hover:bg-[#262626] py-3 rounded-xl text-xs font-bold transition-all active:scale-95 text-white"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 text-white",
                  confirmModal.variant === "danger"
                    ? "bg-red-600 hover:bg-red-500"
                    : accentStyle.bg
                )}
              >
                {confirmModal.variant === "danger" ? "Hapus" : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          PROMPT MODAL
          ═══════════════════════════════════════════════ */}
      {promptModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-white/[0.05] w-full max-w-xs rounded-3xl p-6">
            <h3 className="text-base font-bold mb-4 text-center">{promptModal.title}</h3>
            <input
              type={promptModal.isPassword ? "password" : "text"}
              placeholder={promptModal.placeholder}
              value={promptModal.value}
              autoFocus
              onChange={(e) => setPromptModal((prev) => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") promptModal.onConfirm(promptModal.value); }}
              className="w-full bg-[#1c1c1c] border border-white/[0.05] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-white/20 transition-all placeholder:text-neutral-500 mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPromptModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 bg-[#1c1c1c] hover:bg-[#262626] py-3 rounded-xl text-xs font-bold transition-all active:scale-95 text-white"
              >
                Batal
              </button>
              <button
                onClick={() => promptModal.onConfirm(promptModal.value)}
                className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 text-white", accentStyle.bg)}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce), (.reduce-motion) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}