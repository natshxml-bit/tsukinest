// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="hidden md:block bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition">
            TsukiNest
          </Link>

          {/* Menu Desktop */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white transition font-medium">
              Home
            </Link>
            <Link href="/explore" className="text-gray-300 hover:text-white transition font-medium">
              Explore
            </Link>
            <Link href="/popular" className="text-gray-300 hover:text-white transition font-medium">
              Popular
            </Link>
            <Link href="/latest" className="text-gray-300 hover:text-white transition font-medium">
              Latest
            </Link>
            <Link href="/all" className="text-gray-300 hover:text-white transition font-medium">
              All Series
            </Link>
            {/* ✅ TAMBAHIN INI */}
            <Link href="/blog" className="text-gray-300 hover:text-white transition font-medium">
              Blog
            </Link>
          </div>

          {/* Profile Button */}
          <Link href="/profile" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold">
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}