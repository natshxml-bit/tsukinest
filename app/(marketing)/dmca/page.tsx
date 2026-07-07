import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Mail, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "DMCA & Hak Cipta",
  description: "Kebijakan DMCA dan pelaporan pelanggaran hak cipta TsukiNest.",
};

export default function DMCAPage() {
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
            <Shield className="w-4 h-4 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DMCA & Hak Cipta</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">Kebijakan pelaporan pelanggaran hak cipta dan Digital Millennium Copyright Act</p>

        <div className="space-y-4">
          {/* Pengantar */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-2">Pengantar</h2>
            <p className="text-neutral-400 text-xs leading-relaxed">
              TsukiNest menghormati hak kekayaan intelektual orang lain. Kami merespons dengan cepat terhadap klaim pelanggaran hak cipta yang sesuai dengan Digital Millennium Copyright Act (DMCA).
            </p>
          </section>

          {/* Penting */}
          <section className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-yellow-500 mb-1.5">Penting untuk Diketahui</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  TsukiNest <strong className="text-neutral-300">tidak menyimpan file apapun di server kami</strong>. Semua konten (manhwa, manhua, manga) adalah milik masing-masing pemegang hak cipta. Kami hanya menyediakan platform untuk membaca.
                </p>
              </div>
            </div>
          </section>

          {/* Cara Melapor */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">Cara Mengajukan Klaim DMCA</h2>
            <p className="text-neutral-400 text-xs leading-relaxed mb-4">
              Jika Anda adalah pemilik hak cipta atau agen yang berwenang dan percaya bahwa konten di platform kami melanggar hak cipta Anda, silakan kirimkan email ke:
            </p>

            <div className="bg-[#1c1c1c] border border-white/[0.06] rounded-lg p-4 mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-300">Email DMCA:</span>
              </div>
              <a href="mailto:dmca@tsukinest.my.id" className="text-sm font-mono text-neutral-300 hover:text-white transition-colors">
                dmca@tsukinest.my.id
              </a>
            </div>

            <h3 className="text-xs font-semibold text-white mb-2">Informasi yang Harus Dicantumkan:</h3>
            <ol className="list-decimal list-inside text-neutral-400 text-xs space-y-1.5 ml-1 leading-relaxed">
              <li>Identifikasi karya yang dilindungi hak cipta yang allegedly dilanggar</li>
              <li>Identifikasi materi yang allegedly melanggar (URL lengkap halaman)</li>
              <li>Informasi kontak Anda (nama lengkap, alamat, email, nomor telepon)</li>
              <li>Pernyataan bahwa Anda memiliki itikad baik bahwa penggunaan materi tersebut tidak sah</li>
              <li>Pernyataan bahwa informasi dalam pemberitahuan adalah akurat dan di bawah sumpah</li>
              <li>Tanda tangan fisik atau elektronik dari pemilik hak cipta atau agen yang berwenang</li>
            </ol>
          </section>

          {/* Proses Penanganan */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Proses Penanganan</h2>
            <div className="space-y-4 text-neutral-400 text-xs">
              {[
                { step: "1", title: "Penerimaan Laporan", desc: "Kami akan menerima dan meninjau semua pemberitahuan DMCA yang lengkap." },
                { step: "2", title: "Verifikasi", desc: "Kami akan memverifikasi kelengkapan informasi dan validitas klaim." },
                { step: "3", title: "Tindakan", desc: "Kami akan menghapus atau menonaktifkan akses ke konten yang melanggar dalam waktu 24-48 jam." },
                { step: "4", title: "Notifikasi", desc: "Kami akan mengirimkan konfirmasi tindakan yang telah diambil." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="bg-[#1c1c1c] border border-white/[0.06] text-white font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-[10px]">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-300 mb-0.5">{s.title}</h4>
                    <p className="leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Counter Notice */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">Counter Notice (Sanggahan)</h2>
            <p className="text-neutral-400 text-xs leading-relaxed mb-3">
              Jika Anda percaya bahwa konten Anda telah dihapus secara keliru, Anda dapat mengajukan counter notice dengan menyertakan:
            </p>
            <ul className="list-disc list-inside text-neutral-400 text-xs space-y-1.5 ml-1 leading-relaxed">
              <li>Identifikasi materi yang telah dihapus</li>
              <li>Pernyataan di bawah sumpah bahwa penghapusan adalah karena kesalahan atau salah identifikasi</li>
              <li>Informasi kontak lengkap Anda</li>
              <li>Pernyataan persetujuan dengan yurisdiksi pengadilan federal</li>
              <li>Tanda tangan fisik atau elektronik</li>
            </ul>
          </section>

          {/* Kontak */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight mb-3">Hubungi Tim DMCA Kami</h2>
            <p className="text-neutral-400 text-xs mb-4 leading-relaxed">
              Untuk pertanyaan atau laporan DMCA, hubungi kami di:
            </p>
            <a
              href="mailto:dmca@tsukinest.my.id"
              className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" /> dmca@tsukinest.my.id
            </a>
            <p className="text-neutral-600 text-[11px] mt-3">Waktu respons: 24-48 jam</p>
          </section>
        </div>
      </div>
    </main>
  );
}
