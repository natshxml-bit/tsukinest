import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Info, Shield, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer dan penafian TsukiNest.",
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-6 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
            <Info className="w-4 h-4 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Disclaimer</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">Penafian dan batasan tanggung jawab TsukiNest</p>

        <div className="space-y-4">
          {/* Warning Box */}
          <section className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-400 mb-1.5">Peringatan Penting</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Harap baca disclaimer ini dengan seksama sebelum menggunakan layanan TsukiNest. Dengan menggunakan website ini, Anda menyetujui semua ketentuan yang tercantum di bawah ini.
                </p>
              </div>
            </div>
          </section>

          {/* 1. Konten */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Shield className="w-3 h-3 text-neutral-400" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight">1. Konten dan Hak Cipta</h2>
            </div>
            <div className="text-neutral-400 text-xs leading-relaxed space-y-2">
              <p>Semua konten (manhwa, manhua, manga) yang tersedia di TsukiNest adalah <strong className="text-neutral-300">hak cipta dari masing-masing pemegang hak</strong> (penerbit, penulis, illustrator, atau pihak berwenang lainnya).</p>
              <p><strong className="text-neutral-300">TsukiNest tidak meng-host file apapun di server kami.</strong> Semua konten disediakan oleh pihak ketiga dan kami hanya berfungsi sebagai platform agregator.</p>
              <p>Kami tidak bertanggung jawab atas keakuratan, kelengkapan, atau legalitas konten yang tersedia di platform ini.</p>
            </div>
          </section>

          {/* 2. Penggunaan */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">2. Penggunaan Layanan</h2>
            <div className="text-neutral-400 text-xs leading-relaxed space-y-2">
              <p>Layanan TsukiNest disediakan <strong className="text-neutral-300">&quot;sebagaimana adanya&quot;</strong> dan <strong className="text-neutral-300">&quot;sebagaimana tersedia&quot;</strong> tanpa jaminan apapun, baik tersurat maupun tersirat.</p>
              <p>Penggunaan layanan ini adalah <strong className="text-neutral-300">risiko Anda sendiri</strong>. Kami tidak menjamin bahwa:</p>
              <ul className="list-disc list-inside ml-3 space-y-1">
                <li>Layanan akan tersedia tanpa gangguan atau kesalahan</li>
                <li>Konten akan akurat, lengkap, atau terkini</li>
                <li>Kualitas layanan akan memenuhi harapan Anda</li>
                <li>Setiap kesalahan dalam layanan akan diperbaiki</li>
              </ul>
            </div>
          </section>

          {/* 3. Tanggung Jawab */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">3. Batasan Tanggung Jawab</h2>
            <div className="text-neutral-400 text-xs leading-relaxed space-y-2">
              <p><strong className="text-neutral-300">TsukiNest tidak bertanggung jawab atas:</strong></p>
              <ul className="list-disc list-inside ml-3 space-y-1.5">
                <li>Ketidakakuratan, kesalahan, atau kelalaian dalam konten</li>
                <li>Kerusakan atau kehilangan data akibat penggunaan layanan</li>
                <li>Tindakan ilegal yang dilakukan pengguna</li>
                <li>Konten yang melanggar hak cipta pihak ketiga</li>
                <li>Kerugian langsung, tidak langsung, insidental, atau konsekuensial</li>
                <li>Hilangnya keuntungan atau data bisnis</li>
              </ul>
            </div>
          </section>

          {/* 4. Tautan Eksternal */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">4. Tautan Eksternal</h2>
            <div className="text-neutral-400 text-xs leading-relaxed space-y-2">
              <p>Website kami mungkin mengandung tautan ke website pihak ketiga. Kami tidak memiliki kendali atas konten, kebijakan privasi, atau praktik website tersebut.</p>
              <p>Anda mengakses tautan eksternal atas <strong className="text-neutral-300">risiko Anda sendiri</strong>. Kami sangat menyarankan untuk membaca kebijakan privasi dan syarat layanan setiap website yang Anda kunjungi.</p>
            </div>
          </section>

          {/* 5. Iklan */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">5. Iklan dan Pihak Ketiga</h2>
            <div className="text-neutral-400 text-xs leading-relaxed space-y-2">
              <p>Kami menggunakan layanan iklan dari pihak ketiga (seperti Google AdSense) untuk mendukung operasional website.</p>
              <p>Kami <strong className="text-neutral-300">tidak bertanggung jawab</strong> atas:</p>
              <ul className="list-disc list-inside ml-3 space-y-1">
                <li>Konten iklan yang ditampilkan</li>
                <li>Praktik privasi pengiklan</li>
                <li>Produk atau layanan yang diiklankan</li>
                <li>Transaksi antara Anda dan pengiklan</li>
              </ul>
            </div>
          </section>

          {/* 6. Perubahan Layanan */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">6. Perubahan Layanan</h2>
            <div className="text-neutral-400 text-xs leading-relaxed space-y-2">
              <p>Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan (atau bagian mana pun) kapan saja tanpa pemberitahuan sebelumnya.</p>
              <p>Kami tidak akan bertanggung jawab kepada Anda atau pihak ketiga atas perubahan, penangguhan, atau penghentian layanan.</p>
            </div>
          </section>

          {/* 7. Hukum */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">7. Hukum yang Berlaku</h2>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Disclaimer ini diatur dan ditafsirkan sesuai dengan hukum Indonesia. Setiap sengketa yang timbul dari atau terkait dengan disclaimer ini akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
            </p>
          </section>

          {/* Kontak */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Mail className="w-3 h-3 text-neutral-400" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight">Pertanyaan?</h2>
            </div>
            <p className="text-neutral-400 text-xs mb-3 leading-relaxed">
              Jika Anda memiliki pertanyaan tentang disclaimer ini, silakan hubungi kami:
            </p>
            <a href="mailto:legal@tsukinest.my.id" className="inline-flex items-center gap-2 text-neutral-300 hover:text-white text-xs transition-colors">
              <Mail className="w-3.5 h-3.5" /> legal@tsukinest.my.id
            </a>
          </section>

          <div className="text-center text-neutral-600 text-[11px] pt-2">
            <p>Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
