import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, MessageCircle, ArrowLeft, Heart, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { newsPortalService } from '@/services';
import { Metadata } from 'next';
import { News } from '@/types';
import AdSlot from '@/components/AdSlot';
import { NewsPortalCard } from '@/components/news/NewsPortalCard';
import LikeButton from '@/components/engagement/LikeButton';
import CommentSection from '@/components/CommentSection';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const newsItem = await newsPortalService.getNewsBySlug(slug);
    if (!newsItem) return { title: 'Notícia não encontrada | Melhora Prudente' };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://melhoraprudente.com.br';

    return {
      title: `${newsItem.title} | Melhora Prudente`,
      description: newsItem.excerpt || newsItem.title,
      alternates: {
        canonical: `${baseUrl}/noticia/${newsItem.slug}`,
      },
      openGraph: {
        title: newsItem.title,
        description: newsItem.excerpt || newsItem.title,
        images: newsItem.cover_image ? [newsItem.cover_image] : [],
        type: 'article',
        publishedTime: newsItem.created_at,
        authors: newsItem.author?.full_name ? [newsItem.author.full_name] : ['Redação'],
        section: newsItem.category,
      },
      twitter: {
        card: 'summary_large_image',
        title: newsItem.title,
        description: newsItem.excerpt || newsItem.title,
        images: newsItem.cover_image ? [newsItem.cover_image] : [],
      }
    };
  } catch (error) {
    return { title: 'Melhora Prudente' };
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  let newsItem: News | null = null;
  let relatedNews: News[] = [];

  try {
    newsItem = await newsPortalService.getNewsBySlug(slug);
    if (newsItem) {
      relatedNews = await newsPortalService.getRelatedNews(newsItem.category, newsItem.id, 3);
    }
  } catch (error) {
    console.error('Error fetching news details:', error);
    return notFound();
  }

  if (!newsItem) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": newsItem.title,
    "description": newsItem.excerpt || newsItem.title,
    "image": newsItem.cover_image ? [newsItem.cover_image] : [],
    "datePublished": newsItem.created_at,
    "dateModified": newsItem.updated_at || newsItem.created_at,
    "author": [{
      "@type": "Person",
      "name": newsItem.author?.full_name || "Redação",
      "url": `${process.env.NEXT_PUBLIC_APP_URL || ''}/`
    }]
  };

  return (
    <article className="min-h-screen bg-white pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Detail Header / Top breadcrumb and title */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-red-600 font-bold text-sm mb-8 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o Portal
          </Link>

          <div className="space-y-6">
            <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md shadow-red-600/15">
              {newsItem.category || 'Geral'}
            </span>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 leading-none tracking-tighter">
              {newsItem.title}
            </h1>

            {newsItem.excerpt && (
              <p className="text-lg md:text-xl text-zinc-500 font-medium leading-relaxed border-l-4 border-zinc-200 pl-5">
                {newsItem.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 shadow-inner">
                  {newsItem.author?.avatar_url ? (
                    <img src={newsItem.author.avatar_url} alt={newsItem.author.full_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-zinc-400" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-black text-zinc-950 uppercase tracking-tight">{newsItem.author?.full_name || 'Redação'}</p>
                  <p className="text-zinc-500 text-xs font-medium">Jornalista</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 font-semibold">
                <Calendar size={16} className="text-red-600" />
                {formatDate(newsItem.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Cover Image */}
      {newsItem.cover_image && (
        <div className="container mx-auto px-4 mb-12">
          <div className="max-w-4xl mx-auto aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-xl shadow-zinc-200/40 border border-zinc-100">
            <img 
              src={newsItem.cover_image} 
              alt={newsItem.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Main Body Grid */}
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-12">
            <div 
              className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-zinc-800 prose-p:font-medium prose-a:text-red-600 prose-img:rounded-3xl prose-blockquote:border-red-600 prose-blockquote:bg-zinc-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: newsItem.content }}
            />

            {/* Inline Ad slot */}
            <div className="py-8 border-y border-zinc-100">
              <AdSlot position="article_inline" className="min-h-[100px] bg-zinc-50 rounded-2xl" />
            </div>

            {/* Related Articles block */}
            {relatedNews.length > 0 && (
              <section className="space-y-6 pt-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-5 bg-red-600 rounded-full" />
                  <h3 className="text-lg font-black uppercase tracking-tighter">Notícias Relacionadas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedNews.map((item) => (
                    <NewsPortalCard key={item.id} news={item} className="space-y-2 text-sm" />
                  ))}
                </div>
              </section>
            )}

            {/* Likes System */}
            <div className="pt-8 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">O que achou desta matéria? Deixe seu voto:</span>
              </div>
              <LikeButton newsId={newsItem.id} />
            </div>

            {/* Comment Section (Threaded Replies) */}
            <div className="pt-12 border-t border-zinc-100">
              <CommentSection newsId={newsItem.id} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <AdSlot position="sidebar_news_detail" className="min-h-[250px] bg-zinc-50 rounded-[2rem] border border-zinc-100" />
            
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100/60 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Compartilhar</h4>
              <div className="flex gap-2">
                <button className="flex-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
                  <Share2 size={14} /> WhatsApp
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
