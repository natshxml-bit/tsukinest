"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
// Pastikan "db" udah diexport di file firebase lo ya Bre
import { auth, googleProvider, db } from "@/lib/firebase"; 
import {
  signInWithPopup,
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
// Tambahan import buat narik data dari Firestore
import { collection, query, where, getDocs } from "firebase/firestore";
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
} from "lucide-react";

// Import Cropper
import Cropper from "react-easy-crop";

// ── Shared accent hook ──
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

// ── Fungsi Helper buat generate gambar hasil crop ──
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
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

const IconGoogle = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
));

function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-[#0F0F12] flex flex-col items-center justify-center gap-4 p-4">
      <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse" />
      <div className="w-40 h-5 rounded-lg bg-white/5 animate-pulse" />
      <div className="w-24 h-3 rounded-md bg-white/5 animate-pulse" />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

export default function ProfilePage() {
  const { accent, style: accentStyle, setAccent, customHex, setCustomHex } = useAccent();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Preview & Crop states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [history, setHistory] = useState<ReadingHistory[]>([]);

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

  // ── Toast ──
  const triggerToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Auth & Ambil Data Firebase ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLocalPhoto(u?.photoURL || null);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Ambil history
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    const fetchHistoryFromFirebase = async () => {
      try {
        // Arahin ke sub-collection yang bener sesuai struktur lo
        const historyRef = collection(db, "users", user.uid, "history");
        const querySnapshot = await getDocs(historyRef);
        
        const historyData: ReadingHistory[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Mapping datanya biar pas sama tipe ReadingHistory di Profile
          historyData.push({
            slug: data.slug || doc.id,
            title: data.title || "Tanpa Judul",
            chapter: data.lastReadChapter || "", // Mapping dari lastReadChapter
            thumb: data.thumb || "",
            timestamp: data.savedAt || 0, // Mapping dari savedAt
          });
        });

        // Urutin dari yang terbaru
        historyData.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(historyData);
      } catch (error) {
        console.error("Gagal ngambil history:", error);
      }
    };
    fetchHistoryFromFirebase();
  }, [user]);


  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      triggerToast("Selamat datang kembali!", "success");
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") triggerToast("Gagal masuk dengan Google.", "error");
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

  // ── Edit Name ──
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

  // ── Upload & Crop Logic ──
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { triggerToast("File harus gambar.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { triggerToast("Maksimal 5MB.", "error"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewImage(ev.target?.result as string);
      // Reset state crop saat gambar baru di-load
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
      // Dapatkan gambar hasil crop dalam bentuk blob
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

  const cancelUpload = () => {
    setPreviewImage(null);
  };

  // ── Default Avatar Picker ──
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

  // ── Clear Cache ──
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

  // ── Reset Password ──
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

  // ── Delete Account ──
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

  // ── Logout ──
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

  // ── Copy UID ──
  const copyUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      triggerToast("UID disalin!", "success");
    } catch { triggerToast("Gagal menyalin.", "error"); }
  };

  // ── Stats ──
  const totalRead = history.reduce((acc, h) => acc + (h.chapter ? 1 : 0), 0);
  const joinDate = user?.metadata?.creationTime ? formatDate(new Date(user.metadata.creationTime).getTime()) : "-";

  if (isLoading) return <SkeletonProfile />;

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white pb-28 relative overflow-x-hidden selection:bg-white/10">
      {/* ── TOAST QUEUE ── */}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md flex items-center gap-3 max-w-sm w-full transition-all duration-300",
              t.type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              t.type === "error" && "bg-red-500/10 border-red-500/20 text-red-400",
              t.type === "info" && "bg-purple-500/10 border-purple-500/20 text-purple-400"
            )}
          >
            <span className="text-lg">{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
            <p className="text-xs font-semibold leading-tight">{t.message}</p>
          </div>
        ))}
      </div>

      {/* ── HEADER ── */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-2.5 rounded-xl border shadow-lg", accentStyle.bg + "/10", accentStyle.border, accentStyle.glow)}>
            <Sparkles className={cn("w-5 h-5", accentStyle.text)} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        </div>
      </div>

      {user ? (
        <div className="max-w-md mx-auto px-4 space-y-6">
          {/* ── AVATAR ── */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "relative mb-4 rounded-full p-1 border-2 transition-colors",
                dragOver ? accentStyle.border : "border-white/5"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropPreview}
            >
              <div className="w-28 h-28 rounded-full overflow-hidden bg-[#1A1A24] relative ring-1 ring-white/5">
                <img
                  src={localPhoto || `https://ui-avatars.com/api/?name=${user.displayName || "U"}&background=1A1A24&color=a855f7`}
                  alt="Profile"
                  className={cn("w-full h-full object-cover transition-opacity duration-300")}
                />
              </div>

              <input type="file" accept="image/*" id="upload-pp" className="hidden" onChange={handleFileSelect} />
              <label
                htmlFor="upload-pp"
                className={cn(
                  "absolute bottom-0 right-0 p-2.5 rounded-full border-2 border-[#0F0F12] shadow-lg transition-all active:scale-90 z-10 cursor-pointer hover:brightness-110", 
                  accentStyle.bg
                )}
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
            </div>

            {/* Avatar Default Picker Toggle */}
            <button
              onClick={() => setShowAvatarPicker((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors mb-1"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              Pilih avatar default
            </button>

            {showAvatarPicker && (
              <div className="flex gap-2 mt-2 mb-1 overflow-x-auto max-w-full pb-1 scrollbar-hide px-2">
                {["Asta", "Naruto", "Luffy", "Goku", "Saitama", "Levi", "Zenitsu", "Gojo"].map((seed) => (
                  <button
                    key={seed}
                    onClick={() => setDefaultAvatar(seed)}
                    className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors active:scale-90"
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

            <div className="flex items-center gap-2 mb-0.5 mt-1">
              <h3 className="text-xl font-bold">{user.displayName || "Pembaca Tsuki"}</h3>
              <button onClick={handleEditName} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="truncate max-w-[200px]">{user.email}</span>
              {user.emailVerified && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Terverifikasi
                </span>
              )}
            </div>

            {/* UID */}
            <button
              onClick={copyUid}
              className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
            >
              <span className="text-[11px] text-gray-500 font-mono tracking-tight">{user.uid.slice(0, 14)}...</span>
              <Copy className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1A1A24] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-h-[90px] gap-1">
              <Calendar className={cn("w-5 h-5 mb-0.5", accentStyle.text)} />
              <div className="text-sm font-bold text-white leading-tight text-center">{joinDate}</div>
              <div className="text-[10px] text-gray-500 font-medium">Bergabung</div>
            </div>
            <div className="bg-[#1A1A24] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-h-[90px] gap-1">
              <Clock className={cn("w-5 h-5 mb-0.5", accentStyle.text)} />
              <div className="text-lg font-bold text-white leading-tight">{history.length}</div>
              <div className="text-[10px] text-gray-500 font-medium">History</div>
            </div>
          </div>


          {/* ── RECENT HISTORY ── */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-300">Terakhir Dibaca</h4>
                <button
                  onClick={() => {
                     // TODO: Tambahin logika hapus history di Firebase kalo butuh
                     setHistory([]) 
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {history.slice(0, 10).map((h) => (
                  <a key={`${h.slug}-${h.timestamp}`} href={`/detail/${h.slug}`} className="flex-shrink-0 w-[110px] group">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1A1A24] border border-white/5 mb-2">
                      <img src={h.thumb || "/no-image.png"} alt={h.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{h.chapter}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">{h.title}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{timeAgo(h.timestamp)}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── MAIN MENU ── */}
          <div className="bg-[#1A1A24] border border-white/5 rounded-2xl overflow-hidden">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left group active:scale-[0.99] duration-150"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg", accentStyle.soft)}>
                  <Settings className={cn("w-4 h-4", accentStyle.text)} />
                </div>
                <span className="text-sm font-medium group-hover:text-gray-200 transition-colors">Pengaturan Akun</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </button>

            <div className="h-px bg-white/5 mx-4" />

            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left group active:scale-[0.99] duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-orange-500/10">
                  <Trash2 className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-gray-200 transition-colors">Bersihkan Cache</span>
              </div>
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>

            <div className="h-px bg-white/5 mx-4" />

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors text-left group active:scale-[0.99] duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">Hapus Akun</span>
              </div>
              <AlertTriangle className="w-4 h-4 text-red-500/50" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 text-red-400 border border-red-500/20 py-3.5 rounded-xl font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </button>

          <div className="text-center pt-2 pb-4">
            <span className="text-[10px] text-gray-600 tracking-widest font-bold">TSUKINIME v1.2.0</span>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════
           LOGIN / REGISTER UI
           ═══════════════════════════════════════════════ */
        <div className="max-w-md mx-auto px-4">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4 border", accentStyle.bg + "/10", accentStyle.border)}>
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{isRegisterMode ? "Daftar Akun" : "Selamat Datang"}</h3>
            <p className="text-xs text-gray-400 px-8 leading-relaxed">
              {isRegisterMode ? "Buat akun untuk sinkronisasi data bacaan." : "Masuk untuk menyimpan history dan preferensi."}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="w-full space-y-3 mb-5">
            {isRegisterMode && (
              <input
                type="text"
                placeholder="Nama lengkap..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600"
              required
            />
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kata sandi (min. 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600 pr-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              className={cn(
                "w-full py-3.5 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all text-sm",
                accentStyle.bg,
                accentStyle.glow
              )}
            >
              {isRegisterMode ? "Daftar Sekarang" : "Masuk"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mb-6">
            {isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <span
              onClick={() => { setIsRegisterMode(!isRegisterMode); setEmail(""); setPassword(""); setDisplayName(""); }}
              className={cn("font-bold cursor-pointer hover:underline", accentStyle.text)}
            >
              {isRegisterMode ? "Masuk" : "Daftar"}
            </span>
          </p>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] text-gray-600 font-bold tracking-widest">ATAU</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all text-sm"
          >
            <IconGoogle />
            Lanjutkan dengan Google
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          IMAGE CROP MODAL
          ═══════════════════════════════════════════════ */}
      {previewImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-2xl p-5 shadow-2xl text-center">
            <h3 className="text-base font-bold mb-1">Sesuaikan Foto</h3>
            <p className="text-[11px] text-gray-400 mb-4">Geser dan perbesar biar pas di tengah</p>

            <div className="relative w-full h-64 mb-4 rounded-xl overflow-hidden bg-black/50 border border-white/10 ring-1 ring-white/5">
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

            {/* Zoom Slider */}
            <div className="mb-6 px-2 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400">-</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className={cn("w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white")}
              />
              <span className="text-xs font-bold text-gray-400">+</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelUpload}
                disabled={isUploading}
                className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Batal
              </button>
              <button
                onClick={confirmUpload}
                disabled={isUploading}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 text-white flex items-center justify-center gap-1.5",
                  accentStyle.bg,
                  accentStyle.glow,
                  isUploading && "opacity-70 cursor-wait"
                )}
              >
                {isUploading ? (
                  <div className={cn("w-4 h-4 border-2 border-t-transparent rounded-full animate-spin", accentStyle.bg.replace("bg-", "border-"))} />
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
          SETTINGS SHEET — WARNA AKSEN
          ═══════════════════════════════════════════════ */}
      {isSettingsOpen && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <div
            className="bg-[#141419] w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl border border-white/5 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#141419]/95 backdrop-blur-md z-10 flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Settings className={cn("w-4 h-4", accentStyle.text)} /> Pengaturan
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-8">
              {/* Tampilan */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Tampilan</h4>
                <div className="space-y-3">
                  <div className="bg-[#1A1A24] rounded-xl p-4 border border-white/5">
                    <div className="text-sm font-medium mb-3">Warna Aksen</div>
                    
                    <div className="grid grid-cols-5 gap-3">
                      {/* TOMBOL CUSTOM COLOR PICKER */}
                      <label
                        className={cn(
                          "relative w-9 h-9 rounded-full border-2 transition-all active:scale-90 flex items-center justify-center overflow-hidden cursor-pointer",
                          accent === "custom"
                            ? "border-white scale-110 shadow-lg shadow-black/20"
                            : "border-transparent opacity-60 hover:opacity-100"
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
                        {accent === "custom" && <Check className="w-4 h-4 text-white drop-shadow-md z-10 pointer-events-none" />}
                      </label>

                      {/* ARRAY WARNA DEFAULT */}
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
                            "w-9 h-9 rounded-full border-2 transition-all active:scale-90 flex items-center justify-center",
                            c.bg,
                            accent === c.key 
                              ? "border-white scale-110 shadow-lg shadow-black/20" 
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          aria-label={`Accent ${c.key}`}
                        >
                          {accent === c.key && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1A1A24] rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium block">Mode Hemat</span>
                      <span className="text-[11px] text-gray-500">Kurangi animasi & efek</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={(e) => {
                          document.documentElement.classList.toggle("reduce-motion", e.target.checked);
                        }}
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                    </label>
                  </div>
                </div>
              </section>

              {/* Akun */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Akun</h4>
                <div className="bg-[#1A1A24] rounded-xl border border-white/5 divide-y divide-white/5">
                  <button
                    onClick={() => { setIsSettingsOpen(false); handleEditName(); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left active:scale-[0.99] duration-150"
                  >
                    <span className="text-sm flex items-center gap-3">
                      <Pencil className="w-4 h-4 text-gray-500" /> Ubah Nama Profil
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => { setIsSettingsOpen(false); handleResetPassword(); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left active:scale-[0.99] duration-150"
                  >
                    <span className="text-sm flex items-center gap-3">
                      <Settings className="w-4 h-4 text-gray-500" /> Atur Ulang Kata Sandi
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </section>

              {/* Data */}
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Data</h4>
                <div className="bg-[#1A1A24] rounded-xl border border-white/5 divide-y divide-white/5">
                  <button
                    onClick={() => {
                      const data = JSON.stringify(history, null, 2);
                      const blob = new Blob([data], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `tsuki-backup-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      triggerToast("Backup diunduh!", "success");
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left active:scale-[0.99] duration-150"
                  >
                    <span className="text-sm flex items-center gap-3">
                      <Download className="w-4 h-4 text-gray-500" /> Export History
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => { setIsSettingsOpen(false); handleClearCache(); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left active:scale-[0.99] duration-150"
                  >
                    <span className="text-sm flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-gray-500" /> Bersihkan Cache
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="bg-[#1A1A24] border border-white/10 w-full max-w-xs rounded-2xl p-5 shadow-2xl text-center">
            <h3 className={cn("text-base font-bold mb-2", confirmModal.variant === "danger" ? "text-red-400" : "text-white")}>
              {confirmModal.title}
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed px-1">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                  confirmModal.variant === "danger"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                    : cn(accentStyle.bg, "hover:brightness-110 text-white", accentStyle.glow)
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="bg-[#1A1A24] border border-white/10 w-full max-w-xs rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold mb-3 text-center">{promptModal.title}</h3>
            <input
              type={promptModal.isPassword ? "password" : "text"}
              placeholder={promptModal.placeholder}
              value={promptModal.value}
              autoFocus
              onChange={(e) => setPromptModal((prev) => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") promptModal.onConfirm(promptModal.value); }}
              className="w-full bg-[#0F0F12] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPromptModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => promptModal.onConfirm(promptModal.value)}
                className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 text-white", accentStyle.bg, accentStyle.glow)}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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
