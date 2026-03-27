import React from 'react';
import { newsService } from '@/services';
import { Metadata } from 'next';
import { NewsCard } from '@/components/news/NewsCard';
import AdSlot from '@/components/AdSlot';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Todas as Notícias | Melhora Prudente',
  description: 'Confira todas as notícias de Presidente Prudente e região no Melhora Prudente.',
};

export default async function AllNewsPage() {
  let posts = [];

  try {
    posts = await newsService.getLatestPosts(48);
  } catch (error) {
    console.error('Error fetching latest posts:', error);
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Page Header */}
      <div className="bg-zinc-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600/10 skew-x-12 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl space-y-4">
            <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Arquivo
            </span>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Todas as <span className="text-red-600">Notícias</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
              Fique por dentro de tudo o que acontece em Presidente Prudente e região.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Top Ad */}
        <div className="py-8">
          <AdSlot position="archive_top" className="min-h-[100px]" />
        </div>

        {posts.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {posts.map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>
            
            {/* Load More Placeholder */}
            <div className="flex justify-center pt-8">
              <button className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter hover:bg-red-600 transition-all flex items-center gap-2 group">
                Carregar mais notícias
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200">
            <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">Nenhuma notícia encontrada.</p>
          </div>
        )}

        {/* Footer Ad */}
        <div className="py-12">
          <AdSlot position="archive_footer" className="min-h-[120px] md:min-h-[250px]" />
        </div>
      </div>
    </div>
  );
}
