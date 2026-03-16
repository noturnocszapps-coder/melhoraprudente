import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { newsService, categoryService } from '@/services';
import { Metadata } from 'next';
import { NewsCard } from '@/components/news/NewsCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await categoryService.getAll();
  const category = categories.find(c => c.slug === slug);
  
  if (!category) return { title: 'Categoria não encontrada' };

  return {
    title: `${category.name} | Melhora Prudente`,
    description: `Confira as últimas notícias sobre ${category.name} em Presidente Prudente e região.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  let posts = [];
  let categoryName = '';

  try {
    const categories = await categoryService.getAll();
    const category = categories.find(c => c.slug === slug);
    
    if (!category) return notFound();
    
    categoryName = category.name;
    posts = await newsService.getPostsByCategory(slug, 20);
  } catch (error) {
    console.error('Error fetching category data:', error);
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-red-600 font-black uppercase tracking-widest text-xs mb-4">Categoria</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{categoryName}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Nenhuma notícia nesta categoria ainda.</p>
            <Link href="/" className="inline-block mt-6 text-red-600 font-bold hover:underline">Voltar para a Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
