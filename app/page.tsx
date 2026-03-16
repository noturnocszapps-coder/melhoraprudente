import React from 'react';
import { NewsCard } from '@/components/news/NewsCard';
import { newsService } from '@/services';
import { Post } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';
import { AlertCircle, Settings } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

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

  let featuredPost: Post | null = null;
  let latestNews: Post[] = [];
  let politicsNews: Post[] = [];
  let economyNews: Post[] = [];
  let sportsNews: Post[] = [];
  let fetchError = false;

  try {
    const featuredPosts = await newsService.getFeaturedPosts();
    featuredPost = featuredPosts[0] || null;

    latestNews = await newsService.getLatestPosts(6);
    
    // If no featured post, use the first latest
    if (!featuredPost && latestNews.length > 0) {
      featuredPost = latestNews[0];
      latestNews = latestNews.slice(1);
    }

    politicsNews = await newsService.getPostsByCategory('politica', 3);
    economyNews = await newsService.getPostsByCategory('economia', 3);
    sportsNews = await newsService.getPostsByCategory('esportes', 3);
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
      {/* Top Ad Slot */}
      <div className="container mx-auto px-4 pt-4">
        <AdSlot position="home_top" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        {featuredPost ? (
          <NewsCard post={featuredPost} variant="featured" />
        ) : (
          <div className="aspect-[16/9] bg-zinc-100 rounded-2xl animate-pulse flex items-center justify-center">
            <p className="text-zinc-400 font-bold uppercase tracking-widest">Carregando destaque...</p>
          </div>
        )}
      </section>

      {/* Latest News Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-4">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Últimas Notícias</h2>
          <a href="/noticias" className="text-sm font-bold text-red-600 hover:underline">Ver todas</a>
        </div>
        
        {latestNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {latestNews.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-zinc-400 font-medium">Nenhuma notícia encontrada no momento.</p>
          </div>
        )}
      </section>

      {/* Middle Ad Slot */}
      <section className="container mx-auto px-4 py-8">
        <AdSlot position="home_middle" className="min-h-[100px]" />
      </section>

      {/* Categories Section */}
      <section className="bg-zinc-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Column 1: Politics */}
            <div className="space-y-8">
              <h3 className="text-lg font-black uppercase tracking-widest text-red-600 border-l-4 border-red-600 pl-4">Política</h3>
              <div className="space-y-6">
                {politicsNews.length > 0 ? (
                  politicsNews.map(post => (
                    <NewsCard key={post.id} post={post} variant="horizontal" />
                  ))
                ) : (
                  <p className="text-zinc-400 text-sm italic">Em breve mais notícias de política.</p>
                )}
              </div>
            </div>

            {/* Column 2: Economy */}
            <div className="space-y-8">
              <h3 className="text-lg font-black uppercase tracking-widest text-red-600 border-l-4 border-red-600 pl-4">Economia</h3>
              <div className="space-y-6">
                {economyNews.length > 0 ? (
                  economyNews.map(post => (
                    <NewsCard key={post.id} post={post} variant="horizontal" />
                  ))
                ) : (
                  <p className="text-zinc-400 text-sm italic">Em breve mais notícias de economia.</p>
                )}
              </div>
            </div>

            {/* Column 3: Sports */}
            <div className="space-y-8">
              <h3 className="text-lg font-black uppercase tracking-widest text-red-600 border-l-4 border-red-600 pl-4">Esportes</h3>
              <div className="space-y-6">
                {sportsNews.length > 0 ? (
                  sportsNews.map(post => (
                    <NewsCard key={post.id} post={post} variant="horizontal" />
                  ))
                ) : (
                  <p className="text-zinc-400 text-sm italic">Em breve mais notícias de esportes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Slot */}
      <section className="container mx-auto px-4 py-12">
        <AdSlot position="home_footer" className="min-h-[120px] md:min-h-[250px]" />
      </section>
    </div>
  );
}
