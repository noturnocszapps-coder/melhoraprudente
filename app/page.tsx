import React from 'react';
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
      <div className="container mx-auto px-4 pt-6">
        <AdSlot position="home_top" />
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            {/* Hero Section */}
            <section>
              {featuredPost ? (
                <NewsCard post={featuredPost} variant="featured" />
              ) : (
                <div className="aspect-[16/9] bg-zinc-100 rounded-2xl animate-pulse flex items-center justify-center">
                  <p className="text-zinc-400 font-bold uppercase tracking-widest">Carregando destaque...</p>
                </div>
              )}
            </section>

            {/* Latest News Grid */}
            <section>
              <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-4">
                <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
                  <span className="w-2 h-8 bg-red-600 rounded-full" />
                  Últimas Notícias
                </h2>
                <a href="/noticias" className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
                  Ver todas <ChevronRight size={16} />
                </a>
              </div>
              
              {latestNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {latestNews.map((post) => (
                    <NewsCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-zinc-50 rounded-2xl">
                  <p className="text-zinc-400 font-medium">Nenhuma notícia encontrada no momento.</p>
                </div>
              )}
            </section>

            {/* Middle Ad Slot */}
            <AdSlot position="home_middle" className="min-h-[100px]" />

            {/* Category Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Cidade */}
              <CategoryBlock title="Cidade" slug="cidade" posts={cityNews} />
              {/* Segurança */}
              <CategoryBlock title="Segurança" slug="seguranca" posts={securityNews} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Política */}
              <CategoryBlock title="Política" slug="politica" posts={politicsNews} />
              {/* Esportes */}
              <CategoryBlock title="Esportes" slug="esportes" posts={sportsNews} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Sidebar Ad */}
            <AdSlot position="home_sidebar" className="min-h-[250px] bg-zinc-50 rounded-xl" />

            {/* Mais Lidas */}
            <section className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-red-600" size={20} />
                <h3 className="text-lg font-black uppercase tracking-tighter">Mais Lidas</h3>
              </div>
              <div className="space-y-2">
                {mostRead.map((post, index) => (
                  <div key={post.id} className="flex gap-4 items-start group">
                    <span className="text-2xl font-black text-zinc-200 group-hover:text-red-600 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <NewsCard post={post} variant="compact" className="flex-1 border-0 py-0 pb-4" />
                  </div>
                ))}
              </div>
            </section>

            {/* Newsletter or Socials Placeholder */}
            <section className="bg-red-600 p-8 rounded-2xl text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Fique por dentro</h3>
              <p className="text-red-100 text-sm mb-6">Receba as principais notícias de Presidente Prudente no seu WhatsApp.</p>
              <button className="w-full bg-white text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors">
                Entrar no Grupo
              </button>
            </section>
          </aside>
        </div>
      </main>

      {/* Footer Ad Slot */}
      <section className="container mx-auto px-4 py-12">
        <AdSlot position="home_footer" className="min-h-[120px] md:min-h-[250px]" />
      </section>
    </div>
  );
}

function CategoryBlock({ title, slug, posts }: { title: string, slug: string, posts: Post[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
        <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900">{title}</h3>
        <a href={`/categoria/${slug}`} className="text-xs font-bold text-red-600 hover:underline">Ver mais</a>
      </div>
      <div className="space-y-4">
        {posts.length > 0 ? (
          <>
            <NewsCard post={posts[0]} />
            <div className="space-y-3">
              {posts.slice(1).map(post => (
                <NewsCard key={post.id} post={post} variant="compact" />
              ))}
            </div>
          </>
        ) : (
          <p className="text-zinc-400 text-sm italic">Em breve mais notícias.</p>
        )}
      </div>
    </section>
  );
}
