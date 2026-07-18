'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function AdSenseScript() {
  const pathname = usePathname();

  // Não carregar o AdSense em rotas de administração ou gerenciamento interno
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4237790251786919"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
