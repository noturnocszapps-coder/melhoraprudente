'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import {
  GA_TRACKING_ID,
  CLARITY_PROJECT_ID,
  trackPageView,
  trackEvent,
  trackException
} from '@/lib/analytics';

function TrackerCore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeArticleRef = useRef<string | null>(null);
  const scrollMilestones = useRef<{ [key: number]: boolean }>({ 25: false, 50: false, 75: false, 100: false });
  const articleTimer = useRef<NodeJS.Timeout | null>(null);
  const articleTimeSpent = useRef<number>(0);

  // 1. Track page view on route change
  useEffect(() => {
    if (!pathname) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);

    // Track when user clicks / views specific pages
    if (pathname.startsWith('/noticia/') || pathname.startsWith('/noticias/')) {
      const slug = pathname.split('/').pop() || '';
      activeArticleRef.current = slug;
      scrollMilestones.current = { 25: false, 50: false, 75: false, 100: false };
      articleTimeSpent.current = 0;
      
      trackEvent('abertura_noticia', {
        category: 'Conteúdo',
        label: slug,
        slug
      });

      // Start reading timer (every 10 seconds, increment reading time)
      if (articleTimer.current) clearInterval(articleTimer.current);
      articleTimer.current = setInterval(() => {
        articleTimeSpent.current += 10;
        // Log every 30s milestone up to 3 minutes
        if (articleTimeSpent.current % 30 === 0 && articleTimeSpent.current <= 180) {
          trackEvent('tempo_leitura', {
            category: 'Leitura',
            label: slug,
            value: articleTimeSpent.current,
            slug
          });
        }
      }, 10000);
    } else {
      // Clear active article reading tracking
      activeArticleRef.current = null;
      if (articleTimer.current) {
        clearInterval(articleTimer.current);
        articleTimer.current = null;
      }
    }

    // Track search query if exists
    if (searchParams) {
      const q = searchParams.get('q') || searchParams.get('busca') || searchParams.get('s') || searchParams.get('searchTerm');
      if (q) {
        trackEvent('pesquisa', {
          category: 'Busca',
          term: q
        });
      }
    }

    return () => {
      if (articleTimer.current) {
        clearInterval(articleTimer.current);
        articleTimer.current = null;
      }
    };
  }, [pathname, searchParams]);

  // 2. Scroll Depth Observer
  useEffect(() => {
    const handleScroll = () => {
      if (!activeArticleRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercentage = Math.round((scrollTop / docHeight) * 100);

      const milestones = [25, 50, 75, 100];
      milestones.forEach(milestone => {
        if (scrollPercentage >= milestone && !scrollMilestones.current[milestone]) {
          scrollMilestones.current[milestone] = true;
          trackEvent(`scroll_${milestone}`, {
            category: 'Scroll',
            label: activeArticleRef.current || 'unknown',
            slug: activeArticleRef.current || ''
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // 3. Global click interceptor for categorised navigation / outward links / ads
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      const text = anchor.textContent?.trim() || '';

      // Check for category click
      if (href.startsWith('/categoria/')) {
        const categorySlug = href.split('/').pop() || '';
        trackEvent('clique_categoria', {
          category: 'Navegação',
          label: text,
          slug: categorySlug
        });
      }
      
      // Check for general news click
      else if (href.startsWith('/noticia/') || href.startsWith('/noticias/')) {
        const newsSlug = href.split('/').pop() || '';
        trackEvent('clique_noticia', {
          category: 'Navegação',
          label: text,
          slug: newsSlug
        });
      }

      // Check for advertisement banner clicks
      else if (anchor.closest('[id*="ad-slot"]') || anchor.closest('[class*="ad-slot"]') || href.includes('anuncio') || anchor.getAttribute('id')?.includes('ad')) {
        trackEvent('clique_anuncio', {
          category: 'Publicidade',
          label: href || text,
          href
        });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // 4. Global Error Catching for runtime observability
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackException(event.error || event.message, true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      trackException(reason instanceof Error ? reason : String(reason), false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <>
      {/* 1. Google Analytics 4 Script setup */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>

      {/* 2. Microsoft Clarity Script setup */}
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `}
      </Script>

      {/* Core Tracker executing App Router listeners */}
      <Suspense fallback={null}>
        <TrackerCore />
      </Suspense>
    </>
  );
}
