import React from 'react';
import Link from 'next/link';
import { NewsCard } from '@/components/news/NewsCard';
import BreakingNews from '@/components/news/BreakingNews';
import { newsService } from '@/services';
import { Post } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';
import { AlertCircle, Settings, TrendingUp, ChevronRight } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  if (!isSupabaseConfigured) {
    // ... (keep existing config check)
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

  let breakingNews: Post[] = [];
  let featuredPost: Post | null = null;
  let latestNews: Post[] = [];
  let mostRead: Post[] = [];
  let politicsNews: Post[] = [];
  let cityNews: Post[] = [];
  let securityNews: Post[] = [];
  let sportsNews: Post[] = [];
  let fetchError = false;

  try {
    const [
      breaking,
      featured,
      latest,
      read,
      politics,
      city,
      security,
      sports
    ] = await Promise.all([
      newsService.getBreakingNews(5),
      newsService.getFeaturedPosts(),
      newsService.getLatestPosts(8),
      newsService.getMostRead(5),
      newsService.getPostsByCategory('politica', 4),
      newsService.getPostsByCategory('cidade', 4),
      newsService.getPostsByCategory('seguranca', 4),
      newsService.getPostsByCategory('esportes', 4)
    ]);

    breakingNews = breaking;
    featuredPost = featured[0] || null;
    latestNews = latest;
    mostRead = read;
    politicsNews = politics;
    cityNews = city;
    securityNews = security;
    sportsNews = sports;

    // If no featured post, use the first latest
    if (!featuredPost && latestNews.length > 0) {
      featuredPost = latestNews[0];
      latestNews = latestNews.slice(1);
    }
  } catch (error: any) {
    console.error('Error fetching home data:', JSON.stringify(error, null, 2));
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="text-red-600 mx-auto" size={48} />
          <h2 className="text-xl font-black uppercase tracking-tighter text-red-900">Erro ao Carregar Dados</h2>
          <p className="text-red-700 text-sm">
            Não foi possível carregar as notícias. Verifique sua conexão e tente novamente.
          </p>
          <a 
            href="/"
            className="inline-block bg-red-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition-all"
          >
            Tentar Novamente
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breaking News Strip */}
      <BreakingNews posts={breakingNews} />

      {/* Top Ad Slot */}
      <div className="container mx-auto px-4 pt-8">
        <AdSlot position="home_top" className="bg-zinc-50 border border-zinc-100 rounded-xl" />
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-20">
            {/* Hero Section */}
            <section>
              {featuredPost ? (
                <NewsCard post={featuredPost} variant="featured" />
              ) : (
                <div className="aspect-[16/9] bg-zinc-100 rounded-[2rem] animate-pulse flex items-center justify-center">
                  <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-xs">Carregando destaque...</p>
                </div>
              )}
            </section>

            {/* Latest News Grid */}
            <section>
              <div className="flex items-center justify-between mb-10 border-b-2 border-zinc-900 pb-4">
                <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
                  <span className="w-3 h-10 bg-red-600 rounded-full" />
                  Últimas Notícias
                </h2>
                <a href="/noticias" className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 group">
                  Ver todas <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              
              {latestNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
                  {latestNews.map((post) => (
                    <NewsCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200">
                  <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Nenhuma notícia encontrada no momento.</p>
                </div>
              )}
            </section>

            {/* Middle Ad Slot */}
            <div className="py-4">
              <AdSlot position="home_middle" className="min-h-[120px] bg-zinc-50 border border-zinc-100 rounded-2xl" />
            </div>

            {/* Category Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
              {/* Cidade */}
              <CategoryBlock title="Cidade" slug="cidade" posts={cityNews} />
              {/* Segurança */}
              <CategoryBlock title="Segurança" slug="seguranca" posts={securityNews} />
              {/* Política */}
              <CategoryBlock title="Política" slug="politica" posts={politicsNews} />
              {/* Esportes */}
              <CategoryBlock title="Esportes" slug="esportes" posts={sportsNews} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            {/* Sidebar Ad */}
            <div className="sticky top-32 space-y-12">
              <AdSlot position="home_sidebar" className="min-h-[300px] bg-zinc-50 border border-zinc-100 rounded-[2rem]" />

              {/* Mais Lidas */}
              <section className="bg-zinc-950 text-white p-8 rounded-[2rem] shadow-2xl shadow-zinc-200">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Mais Lidas</h3>
                </div>
                <div className="space-y-8">
                  {mostRead.map((post, index) => (
                    <div key={post.id} className="flex gap-5 items-start group">
                      <span className="text-4xl font-black text-zinc-800 group-hover:text-red-600 transition-colors leading-none">
                        {index + 1}
                      </span>
                      <Link href={`/noticias/${post.slug}`} className="flex-1 space-y-2">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{post.category?.name}</span>
                        <h4 className="text-sm font-black leading-tight group-hover:text-red-500 transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              {/* Newsletter / Socials */}
              <section className="relative overflow-hidden bg-red-600 p-10 rounded-[2rem] text-white shadow-xl shadow-red-200">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-none">Fique por dentro</h3>
                  <p className="text-red-100 text-sm mb-8 font-medium leading-relaxed">Receba as principais notícias de Presidente Prudente diretamente no seu WhatsApp.</p>
                  <button className="w-full bg-white text-red-600 font-black py-4 rounded-2xl hover:bg-red-50 transition-all shadow-lg uppercase tracking-widest text-xs">
                    Entrar no Grupo
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer Ad Slot */}
      <section className="container mx-auto px-4 py-20 border-t border-zinc-100">
        <AdSlot position="home_footer" className="min-h-[150px] md:min-h-[280px] bg-zinc-50 border border-zinc-100 rounded-[2rem]" />
      </section>
    </div>
  );
}

function CategoryBlock({ title, slug, posts }: { title: string, slug: string, posts: Post[] }) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
        <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">{title}</h3>
        <a href={`/categoria/${slug}`} className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors">Ver mais</a>
      </div>
      <div className="space-y-8">
        {posts.length > 0 ? (
          <>
            <NewsCard post={posts[0]} />
            <div className="space-y-6 pt-4 border-t border-zinc-100">
              {posts.slice(1).map(post => (
                <NewsCard key={post.id} post={post} variant="compact" />
              ))}
            </div>
          </>
        ) : (
          <p className="text-zinc-400 text-sm font-medium italic py-10 text-center bg-zinc-50 rounded-2xl">Em breve mais notícias.</p>
        )}
      </div>
    </section>
  );
}
