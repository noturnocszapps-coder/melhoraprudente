import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { newsService, categoryService } from '@/services';
import { Metadata } from 'next';
import { Post, Category } from '@/types';
import { NewsCard } from '@/components/news/NewsCard';
import AdSlot from '@/components/AdSlot';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await categoryService.getBySlug(slug);
    if (!category) return { title: 'Categoria não encontrada' };

    return {
      title: `${category.name} | Melhora Prudente`,
      description: category.description || `Confira as últimas notícias sobre ${category.name} em Presidente Prudente e região.`,
    };
  } catch (error) {
    return { title: 'Melhora Prudente' };
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  let posts: Post[] = [];
  let category: Category | null = null;

  try {
    category = await categoryService.getBySlug(slug);
    if (!category) return notFound();
    
    posts = await newsService.getPostsByCategory(slug, 24);
  } catch (error) {
    console.error('Error fetching category data:', error);
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Category Header */}
      <div className="bg-zinc-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600/10 skew-x-12 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-bold text-sm mb-8 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Home
          </Link>
          <div className="max-w-4xl space-y-4">
            <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Categoria
            </span>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-zinc-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Top Ad */}
        <div className="py-8">
          <AdSlot position="category_top" className="min-h-[100px]" />
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
            <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">Nenhuma notícia nesta categoria ainda.</p>
            <Link href="/" className="inline-block mt-8 bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition-all">
              Voltar para a Home
            </Link>
          </div>
        )}

        {/* Footer Ad */}
        <div className="py-12">
          <AdSlot position="category_footer" className="min-h-[120px] md:min-h-[250px]" />
        </div>
      </div>
    </div>
  );
}
