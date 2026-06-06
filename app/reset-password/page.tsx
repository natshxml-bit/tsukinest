"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

export default function ResetPasswordPage() {
  const { accent, style: accentStyle } = useAccent(); // 👈 INISIALISASI HOOK
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);

  useEffect(() => {
    if (!oobCode) {
      setVerifyingCode(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsValidCode(true);
        setVerifyingCode(false);
      })
      .catch((err) => {
        console.error("Kode expired atau gak valid:", err);
        setIsValidCode(false);
        setVerifyingCode(false);
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oobCode) {
      alert("Akses ilegal nih Bre, kodenya gak ada.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password minimal 6 karakter ya, Bre, biar aman!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Password-nya gak sinkron Bre, coba cek lagi ketikannya.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      alert("Mantap Bre! Password lo berhasil diganti. Langsung login gih.");
      router.push("/profile"); // Sesuaikan kalau URL lo /profile
    } catch (error: any) {
      console.error(error);
      alert("Waduh gagal ganti password: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (verifyingCode) {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex justify-center items-center">
        <div className={`w-8 h-8 border-4 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h3 className="text-xl font-bold mb-2">Link Gak Valid / Expired</h3>
        <p className="text-xs text-gray-400 max-w-xs">
          Mungkin lo udah kelamaan ngebuka link-nya atau link ini udah pernah dipake sebelumnya, Bre. Coba kirim ulang aja dari halaman profil.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1A1A24]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className={`p-3 ${accentStyle.soft} border ${accent === 'custom' ? 'border-[var(--tsuki-custom-hex)] shadow-[0_0_15px_var(--tsuki-custom-hex)]' : accentStyle.border + ' ' + accentStyle.glow} rounded-2xl`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${accentStyle.text}`}>
              <path d="M21.503 15.655a1 1 0 01-1.042 1.488 9 9 0 11-10.96-10.96 1 1 0 011.488-1.042 11.002 11.002 0 0010.514 10.514z" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-center mb-1">Atur Ulang Sandi</h3>
        <p className="text-xs text-gray-400 text-center mb-6">Silakan masukin password baru lo buat TsukiNime.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-400 tracking-wider block mb-1.5 uppercase">Password Baru</label>
            <input 
              type="password" 
              placeholder="Minimal 6 karakter..." 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full bg-[#0F0F12] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white outline-none ${accentStyle.focusRing} transition-colors`}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 tracking-wider block mb-1.5 uppercase">Ulangi Password</label>
            <input 
              type="password" 
              placeholder="Ketik ulang password..." 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-[#0F0F12] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white outline-none ${accentStyle.focusRing} transition-colors`}
              disabled={isLoading}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full ${accentStyle.bg} hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-lg ${accentStyle.glow} active:scale-95 transition-all mt-4 flex justify-center items-center h-12`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Simpan Password Baru"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
