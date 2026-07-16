'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AdSenseScript() {
  const pathname = usePathname();
  const [clientId, setClientId] = useState('ca-pub-4237790251786919'); // Default placeholder client ID

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('settings')
            .select('adsense_code')
            .single();

          if (data?.adsense_code) {
            if (data.adsense_code.startsWith('{')) {
              try {
                const parsed = JSON.parse(data.adsense_code);
                if (parsed.adsense_client_id) {
                  setClientId(parsed.adsense_client_id);
                  return;
                }
              } catch (e) {}
            }
          }
        }

        // Fallback local storage
        if (typeof window !== 'undefined') {
          const cached = window.localStorage.getItem('mp_fallback_settings');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed?.adsense_client_id) {
                setClientId(parsed.adsense_client_id);
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Error fetching AdSense client ID:', e);
      }
    };

    fetchClientId();
  }, []);

  // Do not render AdSense scripts on admin dashboards
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
