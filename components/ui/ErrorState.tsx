import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

interface ErrorStateProps {
  onRetry: () => void;
  accentStyle: { bg: string; text: string };
  message?: string;
}

export function ErrorState({ onRetry, accentStyle, message }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="w-10 h-10 text-neutral-600 mb-3" />
      <h3 className="text-white font-semibold text-base mb-1">Gagal memuat data</h3>
      <p className="text-neutral-500 text-sm mb-5">
        {message || "Cek koneksi internet atau coba lagi"}
      </p>
      <button
        onClick={onRetry}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all active:scale-95",
          accentStyle.bg
        )}
      >
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-xs text-red-400">
        <span className="text-sm">📡</span>
        <span>Koneksi terputus. Menunggu jaringan...</span>
      </div>
    </div>
  );
}
