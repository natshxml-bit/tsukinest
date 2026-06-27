// app/dmca/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Mail, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA & Hak Cipta',
  description: 'Kebijakan DMCA dan pelaporan pelanggaran hak cipta TsukiNest.',
};

export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Kembali ke Beranda
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold">DMCA & Hak Cipta</h1>
        </div>
        
        <p className="text-gray-400 mb-8">
          Kebijakan pelaporan pelanggaran hak cipta dan Digital Millennium Copyright Act
        </p>

        <div className="space-y-6">
          {/* Pengantar */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Pengantar</h2>
            <p className="text-gray-300 leading-relaxed">
              TsukiNest menghormati hak kekayaan intelektual orang lain. Kami merespons 
              dengan cepat terhadap klaim pelanggaran hak cipta yang sesuai dengan 
              Digital Millennium Copyright Act (DMCA).
            </p>
          </section>

          {/* Penting */}
          <section className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Penting untuk Diketahui</h3>
                <p className="text-gray-300">
                  TsukiNest <strong>tidak menyimpan file apapun di server kami</strong>. 
                  Semua konten (manhwa, manhua, manga) adalah milik masing-masing pemegang 
                  hak cipta. Kami hanya menyediakan platform untuk membaca.
                </p>
              </div>
            </div>
          </section>

          {/* Cara Melapor */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Cara Mengajukan Klaim DMCA</h2>
            <p className="text-gray-300 mb-4">
              Jika Anda adalah pemilik hak cipta atau agen yang berwenang dan percaya bahwa 
              konten di platform kami melanggar hak cipta Anda, silakan kirimkan email ke:
            </p>
            
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-blue-400">Email DMCA:</span>
              </div>
              <a 
                href="mailto:dmca@tsukinest.my.id" 
                className="text-xl font-mono text-blue-400 hover:underline"
              >
                dmca@tsukinest.my.id
              </a>
            </div>

            <h3 className="text-xl font-bold mb-3 text-green-400">Informasi yang Harus Dicantumkan:</h3>
            <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
              <li>Identifikasi karya yang dilindungi hak cipta yang allegedly dilanggar</li>
              <li>Identifikasi materi yang allegedly melanggar (URL lengkap halaman)</li>
              <li>Informasi kontak Anda (nama lengkap, alamat, email, nomor telepon)</li>
              <li>Pernyataan bahwa Anda memiliki itikad baik bahwa penggunaan materi tersebut tidak sah</li>
              <li>Pernyataan bahwa informasi dalam pemberitahuan adalah akurat dan di bawah sumpah</li>
              <li>Tanda tangan fisik atau elektronik dari pemilik hak cipta atau agen yang berwenang</li>
            </ol>
          </section>

          {/* Proses Penanganan */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Proses Penanganan</h2>
            <div className="space-y-4 text-gray-300">
              <div className="flex gap-3">
                <div className="bg-green-600 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Penerimaan Laporan</h4>
                  <p className="text-sm">Kami akan menerima dan meninjau semua pemberitahuan DMCA yang lengkap.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-green-600 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Verifikasi</h4>
                  <p className="text-sm">Kami akan memverifikasi kelengkapan informasi dan validitas klaim.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-green-600 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Tindakan</h4>
                  <p className="text-sm">Kami akan menghapus atau menonaktifkan akses ke konten yang melanggar dalam waktu <strong>24-48 jam</strong>.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-green-600 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Notifikasi</h4>
                  <p className="text-sm">Kami akan mengirimkan konfirmasi tindakan yang telah diambil.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Counter Notice */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">Counter Notice (Sanggahan)</h2>
            <p className="text-gray-300 mb-4">
              Jika Anda percaya bahwa konten Anda telah dihapus secara keliru, Anda dapat 
              mengajukan counter notice dengan menyertakan:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Identifikasi materi yang telah dihapus</li>
              <li>Pernyataan di bawah sumpah bahwa penghapusan adalah karena kesalahan atau salah identifikasi</li>
              <li>Informasi kontak lengkap Anda</li>
              <li>Pernyataan persetujuan dengan yurisdiksi pengadilan federal</li>
              <li>Tanda tangan fisik atau elektronik</li>
            </ul>
          </section>

          {/* Kontak */}
          <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Hubungi Tim DMCA Kami</h2>
            <p className="text-gray-300 mb-4">
              Untuk pertanyaan atau laporan DMCA, hubungi kami di:
            </p>
            <a 
              href="mailto:dmca@tsukinest.my.id"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg transition text-lg font-semibold"
            >
              <Mail className="w-5 h-5" />
              dmca@tsukinest.my.id
            </a>
            <p className="text-gray-400 text-sm mt-4">
              Waktu respons: 24-48 jam
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}