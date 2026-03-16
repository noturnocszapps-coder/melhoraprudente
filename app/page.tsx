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
    
    // Check for specific Supabase error: Table not found
    if (error?.code === 'PGRST205') {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tighter text-amber-900">Tabelas não encontradas</h2>
              <p className="text-amber-800 text-sm">
                O banco de dados Supabase está conectado, mas as tabelas necessárias (como 'posts') ainda não foram criadas.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">Como resolver:</p>
              <ol className="text-left text-sm text-amber-800 space-y-2 list-decimal pl-4">
                <li>Abra o seu painel do <strong>Supabase</strong>.</li>
                <li>Vá em <strong>SQL Editor</strong>.</li>
                <li>Clique em <strong>New Query</strong>.</li>
                <li>Copie e cole o código SQL abaixo e clique em <strong>Run</strong>.</li>
              </ol>
              
              <details className="text-left bg-white/50 rounded-xl overflow-hidden border border-amber-200">
                <summary className="px-4 py-2 text-xs font-bold cursor-pointer hover:bg-white/80 transition-colors">
                  Ver Código SQL Necessário
                </summary>
                <div className="p-4 bg-zinc-900 text-zinc-300 text-[10px] font-mono overflow-x-auto max-h-40">
                  <pre>{`-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'usuario' CHECK (role IN ('admin', 'redator', 'usuario')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Categories Table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Posts Table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public Read Access
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Published posts are viewable by everyone" ON posts FOR SELECT USING (status = 'published');`}</pre>
                </div>
              </details>
            </div>
            <a 
              href="/"
              className="inline-block w-full bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-amber-700 transition-all"
            >
              Já executei, atualizar página
            </a>
          </div>
        </div>
      );
    }
  }

  if (fetchError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="text-red-600 mx-auto" size={48} />
          <h2 className="text-xl font-black uppercase tracking-tighter text-red-900">Erro ao Carregar Dados</h2>
          <p className="text-red-700 text-sm">
            Não foi possível carregar as notícias. Verifique se as tabelas do banco de dados foram criadas corretamente.
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
