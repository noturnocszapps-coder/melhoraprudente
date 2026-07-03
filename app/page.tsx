import React from 'react';
import Link from 'next/link';
import { NewsPortalCard } from '@/components/news/NewsPortalCard';
import BreakingNewsPortal from '@/components/news/BreakingNewsPortal';
import { newsPortalService } from '@/services';
import { News } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';
import { FileText, Plus, ChevronRight, HelpCircle, Flame, MapPin, Globe, Award, Sparkles, TrendingUp } from 'lucide-react';
import TrendingWidget from '@/components/engagement/TrendingWidget';
import AudienceWidget from '@/components/news/AudienceWidget';
import GeoFilterFeed from '@/components/news/GeoFilterFeed';

export const revalidate = 60; // Revalidate every minute (ISR)

export default async function Home() {
  let allNews: News[] = [];
  let fetchError = false;

  console.log('[Melhora Prudente] -- CARREGANDO HOME PORTAL NACIONAL --');

  try {
    allNews = await newsPortalService.getLatestNews(100);
    console.log(`[Melhora Prudente] Notícias carregadas com sucesso: ${allNews.length}`);
  } catch (error) {
    console.error('[Melhora Prudente] Erro catastrófico ao obter notícias. Acionando modo resiliente:', error);
    fetchError = true;
    allNews = []; // Robust fallback
  }

  // Filter out actual breaking news (marked with is_breaking or title contains 'PLANTÃO'/'URGENTE')
  const breakingNews = allNews.filter(news => news.is_breaking).slice(0, 5);
  const fallbackBreaking = allNews.slice(0, 4);
  const finalBreakingNews = breakingNews.length > 0 ? breakingNews : fallbackBreaking;

  // Destaque Nacional: First priority is is_featured, second is region === 'BR', third is simply the highest scored
  const nationalFeatured = allNews.find(news => news.is_featured && news.region === 'BR') || 
                           allNews.find(news => news.is_featured) || 
                           allNews.find(news => news.region === 'BR') || 
                           allNews[0] || 
                           null;

  // Editorias Nacionais filters
  const filterNewsByCategory = (categoryName: string) => {
    return allNews.filter(item => {
      const itemCatName = (item.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const searchCatName = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return itemCatName === searchCatName;
    });
  };

  const brasilNews = filterNewsByCategory('Brasil').slice(0, 3);
  const politicaNews = filterNewsByCategory('Política').slice(0, 3);
  const economiaNews = filterNewsByCategory('Economia').slice(0, 3);
  const mundoNews = filterNewsByCategory('Mundo').slice(0, 3);
  const esportesNews = filterNewsByCategory('Esportes').slice(0, 3);
  const tecnologiaNews = filterNewsByCategory('Tecnologia').slice(0, 3);
  const cidadeNews = filterNewsByCategory('Cidade').slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* 🔴 BARRA BREAKING AO VIVO (Ticker contínuo persistente) */}
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
              
              {/* 🧠 DESTAQUE NACIONAL (Premium Showcase) */}
              {nationalFeatured && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-5 bg-red-600 rounded-sm" />
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900">Grande Destaque Nacional</h2>
                    </div>
                    <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md animate-pulse flex items-center gap-1">
                      <Sparkles size={10} />
                      EM FOCO HOJE
                    </span>
                  </div>
                  <NewsPortalCard news={nationalFeatured} variant="featured" className="border border-zinc-200 shadow-xl" />
                </section>
              )}

              {/* PROGRAMMATIC AD: MIDDLE (Interspersed natively) */}
              <div className="py-2">
                <AdSlot position="home_middle" className="min-h-[100px] md:min-h-[140px] bg-white border border-zinc-200/60 rounded-2xl shadow-sm" />
              </div>

              {/* 🌎 SISTEMA GEO-INTELIGENTE (Interactive Regional Feed) */}
              <section className="space-y-6 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-5 bg-zinc-900 rounded-sm" />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900">Região e Localidade</h2>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">OESTE PAULISTA & BRASIL</span>
                </div>
                <GeoFilterFeed initialNews={allNews} />
              </section>

              {/* 🗂 EDITORIAS NACIONAIS GRID */}
              <section className="space-y-8 pt-4">
                <div className="flex items-center gap-2 border-b-2 border-zinc-950 pb-3">
                  <span className="w-2.5 h-6 bg-red-600 rounded-sm" />
                  <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-zinc-950">Editorias Nacionais</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Brasil */}
                  <CategoryBlock title="Brasil" posts={brasilNews} />
                  {/* Política */}
                  <CategoryBlock title="Política" posts={politicaNews} />
                  {/* Economia */}
                  <CategoryBlock title="Economia" posts={economiaNews} />
                  {/* Mundo */}
                  <CategoryBlock title="Mundo" posts={mundoNews} />
                  {/* Esportes */}
                  <CategoryBlock title="Esportes" posts={esportesNews} />
                  {/* Tecnologia */}
                  <CategoryBlock title="Tecnologia" posts={tecnologiaNews} />
                </div>
              </section>
            </div>

            {/* RIGHT SIDEBAR (4 Columns) */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-28 space-y-8">
                
                {/* 📡 AUDIÊNCIA EM TEMPO REAL */}
                <AudienceWidget newsTitle={nationalFeatured?.title} />

                {/* SIDEBAR BANNER AD */}
                <AdSlot position="home_sidebar" className="min-h-[250px] bg-white border border-zinc-200/60 rounded-3xl shadow-sm overflow-hidden" />

                {/* 🔥 EM ALTA NO BRASIL (Trending Widget Multi-Tab) */}
                <TrendingWidget />

                {/* PREMIUM NEWSLETTER CARD */}
                <section className="relative overflow-hidden bg-zinc-950 p-8 rounded-[2rem] text-white shadow-2xl shadow-zinc-950/25 border border-zinc-800">
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-4">
                    <div className="bg-red-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                      <Flame className="text-white animate-bounce" size={18} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Boletim G1-Style</h3>
                    <p className="text-zinc-400 text-[11px] font-semibold leading-relaxed">
                      Assine nossa newsletter nacional para receber breaking news diretamente em seu e-mail.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="Seu e-mail..."
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-600 flex-1 font-semibold text-white"
                      />
                      <button className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[9px] px-4 rounded-xl transition-all">
                        Enviar
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
              <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium">
                Seja o primeiro a publicar uma matéria no portal Melhora Prudente. Vá até o painel administrativo.
              </p>
            </div>
            <div className="pt-2">
              <Link 
                href="/admin/noticias/nova" 
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs py-3.5 px-8 rounded-2xl inline-flex items-center gap-2 transition-all shadow-md"
              >
                <Plus size={16} />
                Escrever Notícia
              </Link>
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

function CategoryBlock({ title, posts }: { title: string, posts: News[] }) {
  return (
    <section className="bg-white border border-zinc-200/70 p-6 rounded-3xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
        <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
          <span className="w-1.5 h-3.5 bg-red-600 rounded-sm" />
          {title}
        </h3>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Editoria</span>
      </div>
      <div className="space-y-4">
        {posts.length > 0 ? (
          <>
            <NewsPortalCard news={posts[0]} variant="default" className="text-sm" />
            <div className="space-y-2 divide-y divide-zinc-100">
              {posts.slice(1).map(item => (
                <NewsPortalCard key={item.id} news={item} variant="compact" />
              ))}
            </div>
          </>
        ) : (
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest py-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100">
            Nenhuma notícia cadastrada
          </p>
        )}
      </div>
    </section>
  );
}
