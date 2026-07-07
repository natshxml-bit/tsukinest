import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Cookie, Lock, UserCheck, FileText, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi TsukiNest mengenai pengumpulan dan penggunaan data pengguna.",
};

export default function PrivacyPage() {
  const sections = [
    {
      num: "1",
      title: "Informasi Yang Kami Kumpulkan",
      icon: UserCheck,
      body: (
        <>
          <p className="mb-2">Kami mengumpulkan beberapa jenis informasi untuk berbagai tujuan untuk menyediakan dan meningkatkan layanan kami kepada Anda:</p>
          <ul className="list-disc list-inside ml-3 space-y-1">
            <li>Informasi akun (email, username, password)</li>
            <li>Data penggunaan (riwayat baca, favorit, library)</li>
            <li>Informasi perangkat (browser, OS, IP address)</li>
            <li>Cookies dan teknologi pelacakan serupa</li>
          </ul>
        </>
      ),
    },
    {
      num: "2",
      title: "Bagaimana Kami Menggunakan Informasi",
      icon: FileText,
      body: (
        <>
          <p className="mb-2">Informasi yang kami kumpulkan digunakan untuk berbagai tujuan:</p>
          <ul className="list-disc list-inside ml-3 space-y-1">
            <li>Untuk menyediakan dan memelihara layanan kami</li>
            <li>Untuk memberitahu Anda tentang perubahan layanan</li>
            <li>Untuk memberikan dukungan pelanggan</li>
            <li>Untuk memberikan analisis atau informasi berharga</li>
            <li>Untuk memantau penggunaan layanan</li>
            <li>Untuk mendeteksi, mencegah dan mengatasi masalah teknis</li>
            <li>Untuk mempersonalisasi pengalaman membaca Anda</li>
          </ul>
        </>
      ),
    },
    {
      num: "3",
      title: "Cookies",
      icon: Cookie,
      body: (
        <>
          <p className="mb-2">Kami menggunakan cookies dan teknologi pelacakan serupa untuk melacak aktivitas di layanan kami dan menyimpan informasi tertentu.</p>
          <p>Cookies adalah file dengan jumlah data kecil yang mungkin mencakup pengidentifikasi unik anonim. Anda dapat menginstruksikan browser Anda untuk menolak semua cookies atau untuk menunjukkan kapan cookie dikirim.</p>
        </>
      ),
    },
    {
      num: "4",
      title: "Keamanan Data",
      icon: Lock,
      body: (
        <p>
          Keamanan data Anda penting bagi kami, tapi ingat bahwa tidak ada metode transmisi melalui internet, atau metode penyimpanan elektronik yang 100% aman. Meskipun kami berusaha menggunakan cara yang dapat diterima secara komersial untuk melindungi Data Pribadi Anda, kami tidak dapat menjamin keamanan absolutnya.
        </p>
      ),
    },
    {
      num: "5",
      title: "Hak Anda",
      icon: UserCheck,
      body: (
        <>
          <p className="mb-2">Anda memiliki hak-hak berikut terkait data pribadi Anda:</p>
          <ul className="list-disc list-inside ml-3 space-y-1">
            <li>Hak untuk mengakses data pribadi Anda</li>
            <li>Hak untuk memperbaiki data yang tidak akurat</li>
            <li>Hak untuk menghapus data pribadi Anda</li>
            <li>Hak untuk membatasi pemrosesan data</li>
            <li>Hak untuk menarik persetujuan</li>
          </ul>
        </>
      ),
    },
    {
      num: "6",
      title: "Perubahan Kebijakan Privasi",
      icon: FileText,
      body: (
        <p>
          Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini dan memperbarui tanggal &quot;Terakhir diperbarui&quot;.
        </p>
      ),
    },
  ];

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
          <h1 className="text-2xl font-bold tracking-tight">Kebijakan Privasi</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-4">
          {sections.map((s) => (
            <section key={s.num} className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                  <s.icon className="w-3 h-3 text-neutral-400" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight">
                  {s.num}. {s.title}
                </h2>
              </div>
              <div className="text-neutral-400 text-xs leading-relaxed">{s.body}</div>
            </section>
          ))}

          {/* Kontak */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Mail className="w-3 h-3 text-neutral-400" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight">Hubungi Kami</h2>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di:{" "}
              <a href="mailto:privacy@tsukinest.my.id" className="text-neutral-300 hover:text-white transition-colors">
                privacy@tsukinest.my.id
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
