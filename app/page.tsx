import React from 'react';
import Link from 'next/link';
import { NewsPortalCard } from '@/components/news/NewsPortalCard';
import BreakingNewsPortal from '@/components/news/BreakingNewsPortal';
import NewsCarousel from '@/components/news/NewsCarousel';
import { newsPortalService, engagementService } from '@/services';
import { News } from '@/types';
import AdSlot from '@/components/AdSlot';
import { FileText, Flame, Sparkles } from 'lucide-react';
import TrendingWidget from '@/components/engagement/TrendingWidget';
import AudienceWidget from '@/components/news/AudienceWidget';

export const revalidate = 60; // Revalidate every minute (ISR)

export default async function Home() {
  let allNews: News[] = [];
  let carouselNews: News[] = [];
  let fetchError = false;

  console.log('[Melhora Prudente] -- CARREGANDO HOME PORTAL LOCAL --');

  try {
    // Get latest news (limit 100)
    allNews = await newsPortalService.getLatestNews(100);
    
    // Get top trending local news for the carousel (limit 8)
    carouselNews = await engagementService.getTrendingNews(8);
    
    console.log(`[Melhora Prudente] Notícias carregadas com sucesso: ${allNews.length}`);
  } catch (error) {
    console.error('[Melhora Prudente] Erro ao obter notícias. Acionando modo resiliente:', error);
    fetchError = true;
    allNews = [];
    carouselNews = [];
  }

  // Filter out actual local breaking news (marked with is_breaking or title contains 'PLANTÃO'/'URGENTE')
  const finalBreakingNews = allNews.filter(news => news.is_breaking).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* 🔴 BARRA BREAKING AO VIVO (Ticker contínuo persistente local) */}
      {finalBreakingNews.length > 0 && (
        <BreakingNewsPortal newsItems={finalBreakingNews} />
      )}

      {/* Programmatic Top Banner Ad Slot */}
      <div className="container mx-auto px-4 pt-6">
        <AdSlot position="home_top" className="min-h-[90px] md:min-h-[120px] bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {allNews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT / CENTER CORE AREA (8 Columns) */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* 🎯 CARROSSEL DE DESTAQUES PRINCIPAIS (G1/UOL Style) */}
              {carouselNews.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-5 bg-red-600 rounded-sm" />
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900">Principais Notícias de Prudente</h2>
                    </div>
                    <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1 animate-pulse">
                      <Sparkles size={10} />
                      EM DESTAQUE
                    </span>
                  </div>
                  <NewsCarousel newsItems={carouselNews} />
                </section>
              )}

              {/* PROGRAMMATIC AD: MIDDLE (Interspersed natively) */}
              <div className="py-2">
                <AdSlot position="home_middle" className="min-h-[100px] md:min-h-[140px] bg-white border border-zinc-200/60 rounded-2xl shadow-sm" />
              </div>

              {/* 📰 ÚLTIMAS NOTÍCIAS DE PRUDENTE (Chronological list/grid) */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b-2 border-zinc-950 pb-3">
                  <span className="w-2.5 h-6 bg-red-600 rounded-sm" />
                  <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-zinc-950">Últimas Notícias de Prudente</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {allNews.map((newsItem) => (
                    <div key={newsItem.id} className="relative bg-white border border-zinc-200/60 p-4 rounded-3xl shadow-sm transition-all duration-300 hover:translate-y-[-2px]">
                      <NewsPortalCard news={newsItem} variant="default" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT SIDEBAR (4 Columns) */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-28 space-y-8">
                
                {/* 📈 MAIS LIDAS / MAIS RECENTES EDITORIAL */}
                <AudienceWidget />

                {/* SIDEBAR BANNER AD */}
                <AdSlot position="home_sidebar" className="min-h-[250px] bg-white border border-zinc-200/60 rounded-3xl shadow-sm overflow-hidden" />

                {/* 🔥 EM ALTA LOCAL (Trending Widget Local) */}
                <TrendingWidget />

                {/* PREMIUM NEWSLETTER CARD LOCAL */}
                <section className="relative overflow-hidden bg-zinc-950 p-8 rounded-[2rem] text-white shadow-2xl shadow-zinc-950/25 border border-zinc-800">
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-4">
                    <div className="bg-red-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                      <Flame className="text-white animate-bounce" size={18} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Boletim Prudente</h3>
                    <p className="text-zinc-400 text-[11px] font-semibold leading-relaxed">
                      Assine nossa newsletter local para receber as notícias de Presidente Prudente e região direto no seu e-mail.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="Seu e-mail..."
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 flex-1 font-semibold text-white"
                      />
                      <button className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[9px] px-4 rounded-xl transition-all">
                        Assinar
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        ) : (
          /* Empty/Fallback State (No News) */
          <div className="py-24 text-center max-w-2xl mx-auto space-y-6 bg-white border border-zinc-200 border-dashed rounded-[2.5rem] p-12 shadow-sm">
            <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Nenhuma notícia publicada ainda</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto font-medium leading-relaxed">
                Novas notícias serão publicadas em breve.<br />
                Acompanhe o Melhora Prudente para ficar informado sobre Presidente Prudente e região.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Programmatic Bottom Footer Ad Slot */}
      <section className="container mx-auto px-4 py-12 border-t border-zinc-200">
        <AdSlot position="home_footer" className="min-h-[150px] md:min-h-[200px] bg-white border border-zinc-200/60 rounded-[2rem] shadow-sm overflow-hidden" />
      </section>
    </div>
  );
}
