import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { newsService } from '@/services';
import { Metadata } from 'next';
import { Post } from '@/types';
import CommentSection from '@/components/CommentSection';
import AdSlot from '@/components/AdSlot';
import { NewsCard } from '@/components/news/NewsCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await newsService.getPostBySlug(slug);
    if (!post) return { title: 'Notícia não encontrada' };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://melhoraprudente.com.br';

    return {
      title: `${post.title} | Melhora Prudente`,
      description: post.subtitle || post.excerpt || post.title,
      alternates: {
        canonical: `${baseUrl}/noticias/${post.slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.subtitle || post.excerpt || post.title,
        images: post.cover_image_url ? [post.cover_image_url] : [],
        type: 'article',
        publishedTime: post.published_at || post.created_at,
        authors: post.author?.full_name ? [post.author.full_name] : ['Redação'],
        section: post.category?.name,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.subtitle || post.excerpt || post.title,
        images: post.cover_image_url ? [post.cover_image_url] : [],
      }
    };
  } catch (error) {
    return { title: 'Melhora Prudente' };
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  let post;
  let relatedPosts: Post[] = [];
  let mostRead: Post[] = [];

  try {
    post = await newsService.getPostBySlug(slug);
    if (post) {
      [relatedPosts, mostRead] = await Promise.all([
        newsService.getRelatedPosts(post.category_id, post.id, 3),
        newsService.getMostRead(5)
      ]);
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    return notFound();
  }

  if (!post) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.subtitle || post.excerpt || post.title,
    "image": post.cover_image_url ? [post.cover_image_url] : [],
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": [{
      "@type": "Person",
      "name": post.author?.full_name || "Redação",
      "url": `${process.env.NEXT_PUBLIC_APP_URL || ''}/`
    }]
  };

  return (
    <article className="min-h-screen bg-white pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-red-600 font-bold text-sm mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para a Home
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          {post.category && (
            <Link href={`/category/${post.category.slug}`} className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              {post.category.name}
            </Link>
          )}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 leading-tight tracking-tighter">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed border-l-4 border-zinc-100 pl-6">
              {post.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                {post.author?.avatar_url ? (
                  <img src={post.author.avatar_url} alt={post.author.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-zinc-400" />
                )}
              </div>
              <div className="text-sm">
                <p className="font-black text-zinc-900 uppercase tracking-tighter">{post.author?.full_name || 'Redação'}</p>
                <p className="text-zinc-500 text-xs">Melhora Prudente</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
              <Calendar size={18} className="text-red-600" />
              {formatDate(post.published_at || post.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.cover_image_url && (
        <div className="container mx-auto px-4 mb-12">
          <div className="max-w-5xl mx-auto aspect-[16/9] overflow-hidden rounded-[2rem] bg-zinc-100 shadow-xl shadow-zinc-200/50">
            <img 
              src={post.cover_image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="flex gap-4 mb-8 sticky top-24 float-left -ml-20 hidden xl:flex flex-col">
              <button className="p-3 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors shadow-sm">
                <Share2 size={20} />
              </button>
              <button className="p-3 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors shadow-sm">
                <MessageCircle size={20} />
              </button>
            </div>

            <div 
              className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-a:text-red-600 prose-img:rounded-3xl prose-blockquote:border-red-600 prose-blockquote:bg-zinc-50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Ad inside content placeholder */}
            <div className="my-12 py-8 border-y border-zinc-100">
              <AdSlot position="article_inline" className="min-h-[100px]" />
            </div>

            {/* Related News */}
            {relatedPosts.length > 0 && (
              <section className="mt-16 space-y-8">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-6 bg-red-600 rounded-full" />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Leia Também</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map(related => (
                    <NewsCard key={related.id} post={related} variant="default" className="space-y-3" />
                  ))}
                </div>
              </section>
            )}

            {/* Comments Section */}
            <div className="mt-16 pt-16 border-t border-zinc-100">
              <CommentSection postId={post.id} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            <AdSlot position="sidebar_news_detail" className="min-h-[250px] bg-zinc-50 rounded-2xl" />
            
            <section className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-red-600" />
                Mais lidas
              </h3>
              <div className="space-y-4">
                {mostRead.map((item, idx) => (
                  <NewsCard key={item.id} post={item} variant="compact" />
                ))}
              </div>
            </section>

            <AdSlot position="sidebar_news_detail_bottom" className="min-h-[250px] bg-zinc-50 rounded-2xl" />
          </aside>
        </div>
      </div>
    </article>
  );
}

function TrendingUp({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
