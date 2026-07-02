import React from 'react';
import Link from 'next/link';
import { NewsPortalCard } from '@/components/news/NewsPortalCard';
import BreakingNewsPortal from '@/components/news/BreakingNewsPortal';
import { newsPortalService } from '@/services';
import { News } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';
import { AlertCircle, Settings, TrendingUp, ChevronRight, FileText, Plus } from 'lucide-react';
import TrendingWidget from '@/components/engagement/TrendingWidget';

export const revalidate = 60; // Revalidate every minute for real-time news updates

export default async function Home() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-50 border border-zinc-200 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Settings size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tighter">Configuração Necessária</h2>
            <p className="text-zinc-500 text-sm">
              As credenciais do Supabase não foram encontradas. Por favor, configure as variáveis de ambiente no painel de Segredos.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl text-left text-xs font-mono text-zinc-600 overflow-x-auto">
            <p>NEXT_PUBLIC_SUPABASE_URL</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          </div>
        </div>
      </div>
    );
  }

  let allNews: News[] = [];
  let fetchError = false;
  let errorDetails: any = null;

  try {
    // Fetch latest news from the custom 'news' table
    allNews = await newsPortalService.getLatestNews(30);
  } catch (error: any) {
    console.error('Error fetching portal news:', error);
    fetchError = true;
    errorDetails = error;
  }

  if (fetchError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="text-red-600 mx-auto" size={48} />
          <h2 className="text-xl font-black uppercase tracking-tighter text-red-900">Erro ao Carregar Notícias</h2>
          <p className="text-red-700 text-sm">
            Não foi possível estabelecer contato com o banco de dados. Por favor, tente novamente mais tarde.
          </p>
          {errorDetails && (
            <div className="p-4 bg-white/80 rounded-xl text-left text-xs font-mono text-red-800 border border-red-100 overflow-x-auto">
              <p className="font-bold">Message: {errorDetails.message || errorDetails.toString()}</p>
              {errorDetails.code && <p>Code: {errorDetails.code}</p>}
              {errorDetails.details && <p>Details: {errorDetails.details}</p>}
              {errorDetails.hint && <p>Hint: {errorDetails.hint}</p>}
            </div>
          )}
          <Link 
            href="/"
            className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-red-700 transition-all"
          >
            Tentar Novamente
          </Link>
        </div>
      </div>
    );
  }

  // Decompose fetched news items
  const breakingNews = allNews.slice(0, 5); // Ticker headlines
  const featuredNews = allNews[0] || null; // Main big headline
  const secondaryNews = allNews.slice(1, 7); // Sidebar / Sub-headlines
  const listNews = allNews.slice(7); // Remaining news items in bottom listing

  // Categories lists
  const normalizeCategory = (cat: string) => cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filterNewsByCategory = (catName: string) => {
    return allNews.filter(item => normalizeCategory(item.category) === normalizeCategory(catName));
  };

  const cityNews = filterNewsByCategory('Cidade').slice(0, 3);
  const politicsNews = filterNewsByCategory('Política').slice(0, 3);
  const securityNews = filterNewsByCategory('Segurança').slice(0, 3);
  const sportsNews = filterNewsByCategory('Esportes').slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Breaking News Ticker banner */}
      {breakingNews.length > 0 && <BreakingNewsPortal newsItems={breakingNews} />}

      {/* Top Banner Ad slot */}
      <div className="container mx-auto px-4 pt-8">
        <AdSlot position="home_top" className="bg-zinc-50 border border-zinc-100 rounded-xl" />
      </div>

      <main className="container mx-auto px-4 py-12">
        {allNews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Content Area (Columns 1-8) */}
            <div className="lg:col-span-8 space-y-16">
              
              {/* Highlight Main Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-5 bg-red-600 rounded-full" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">Acontecimento Principal</h2>
                </div>
                {featuredNews && (
                  <NewsPortalCard news={featuredNews} variant="featured" />
                )}
              </section>

              {/* Latest News Sub-Grid */}
              {secondaryNews.length > 0 && (
                <section className="space-y-8">
                  <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-4">
                    <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                      <span className="w-2.5 h-8 bg-red-600 rounded-full" />
                      Manchetes Recentes
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                    {secondaryNews.map((newsItem) => (
                      <NewsPortalCard key={newsItem.id} news={newsItem} variant="default" />
                    ))}
                  </div>
                </section>
              )}

              {/* Middle Banner Ad slot */}
              <div className="py-4">
                <AdSlot position="home_middle" className="min-h-[120px] bg-zinc-50 border border-zinc-100 rounded-2xl" />
              </div>

              {/* Categorized Columns Grid */}
              <section className="space-y-12">
                <div className="border-b-2 border-zinc-950 pb-3 mb-8">
                  <h2 className="text-2xl font-black tracking-tighter uppercase">Cobertura por Editorias</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Cidade Editoria */}
                  <CategoryBlock title="Cidade" posts={cityNews} />
                  {/* Segurança Editoria */}
                  <CategoryBlock title="Segurança" posts={securityNews} />
                  {/* Política Editoria */}
                  <CategoryBlock title="Política" posts={politicsNews} />
                  {/* Esportes Editoria */}
                  <CategoryBlock title="Esportes" posts={sportsNews} />
                </div>
              </section>

              {/* More Published News list */}
              {listNews.length > 0 && (
                <section className="space-y-8 pt-8 border-t border-zinc-100">
                  <h3 className="text-xl font-black tracking-tighter uppercase mb-6">Mais Notícias Publicadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listNews.map((newsItem) => (
                      <NewsPortalCard key={newsItem.id} news={newsItem} variant="default" />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Sidebar Area (Columns 9-12) */}
            <aside className="lg:col-span-4 space-y-12">
              <div className="sticky top-32 space-y-12">
                
                {/* Sidebar Banner Ad slot */}
                <AdSlot position="home_sidebar" className="min-h-[250px] bg-zinc-50 border border-zinc-100 rounded-[2rem]" />

                {/* Most Read (Trending) Section */}
                <TrendingWidget />

                {/* Newsletter / Social Invite Panel */}
                <section className="relative overflow-hidden bg-red-600 p-8 rounded-[2rem] text-white shadow-xl shadow-red-200">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Fique por dentro</h3>
                    <p className="text-red-100 text-xs font-medium leading-relaxed">
                      Participe do nosso grupo oficial do WhatsApp e receba boletins informativos e plantões de Presidente Prudente em tempo real.
                    </p>
                    <a 
                      href="https://chat.whatsapp.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-white text-red-600 font-black py-3.5 rounded-2xl hover:bg-red-50 transition-all shadow-lg uppercase tracking-widest text-xs inline-block text-center"
                    >
                      Entrar no Grupo
                    </a>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        ) : (
          <div className="py-24 text-center max-w-2xl mx-auto space-y-6 bg-zinc-50 border border-zinc-200 border-dashed rounded-[2.5rem] p-12">
            <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Nenhuma notícia publicada ainda</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto">
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

      {/* Bottom Footer Ad slot */}
      <section className="container mx-auto px-4 py-16 border-t border-zinc-100">
        <AdSlot position="home_footer" className="min-h-[150px] md:min-h-[250px] bg-zinc-50 border border-zinc-100 rounded-[2rem]" />
      </section>
    </div>
  );
}

function CategoryBlock({ title, posts }: { title: string, posts: News[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900">{title}</h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Editoria</span>
      </div>
      <div className="space-y-6">
        {posts.length > 0 ? (
          <>
            <NewsPortalCard news={posts[0]} />
            {posts.slice(1).map(item => (
              <NewsPortalCard key={item.id} news={item} variant="compact" />
            ))}
          </>
        ) : (
          <p className="text-zinc-400 text-xs font-medium italic py-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100">
            Nenhuma notícia cadastrada nesta editoria.
          </p>
        )}
      </div>
    </section>
  );
}
