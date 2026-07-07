// components/FooterWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Footer cuma muncul di homepage
  if (pathname !== '/') return null;
  
  return <Footer />;
}