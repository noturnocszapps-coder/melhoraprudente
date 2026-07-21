import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, MessageCircle, ArrowLeft, Heart, MessageSquare, ChevronRight, Clock } from 'lucide-react';
import { formatDate, sanitizeHtml, formatContentToHtml } from '@/lib/utils';
import { newsPortalService } from '@/services';
import { Metadata } from 'next';
import { News } from '@/types';
import AdSlot from '@/components/AdSlot';
import { NewsPortalCard } from '@/components/news/NewsPortalCard';
import LikeButton from '@/components/engagement/LikeButton';
import CommentSection from '@/components/CommentSection';
import ViewTracker from '@/components/engagement/ViewTracker';
import ShareWidget from '@/components/engagement/ShareWidget';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const newsItem = await newsPortalService.getNewsBySlug(slug);
    if (!newsItem) return { title: 'Notícia não encontrada | Melhora Prudente' };

    const baseUrl = 'https://melhoraprudente.com.br';

    return {
      title: `${newsItem.title} | Melhora Prudente`,
      description: newsItem.excerpt || newsItem.title,
      alternates: {
        canonical: `${baseUrl}/noticia/${newsItem.slug}`,
      },
      openGraph: {
        title: newsItem.title,
        description: newsItem.excerpt || newsItem.title,
        images: newsItem.cover_image ? [newsItem.cover_image] : ["https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200&h=630"],
        type: 'article',
        publishedTime: newsItem.created_at,
        modifiedTime: newsItem.updated_at || newsItem.created_at,
        authors: newsItem.author?.full_name ? [newsItem.author.full_name] : ['Redação Melhora Prudente'],
        section: newsItem.category,
      },
      twitter: {
        card: 'summary_large_image',
        title: newsItem.title,
        description: newsItem.excerpt || newsItem.title,
        images: newsItem.cover_image ? [newsItem.cover_image] : ["https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200&h=630"],
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

  // Dynamic reading time calculation (approx 200 words per minute)
  const wordCount = newsItem.content ? newsItem.content.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://melhoraprudente.com.br/noticia/${newsItem.slug}`
    },
    "headline": newsItem.title,
    "description": newsItem.excerpt || newsItem.title,
    "image": newsItem.cover_image ? [newsItem.cover_image] : ["https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200&h=630"],
    "datePublished": newsItem.created_at,
    "dateModified": newsItem.updated_at || newsItem.created_at,
    "author": [{
      "@type": "Person",
      "name": newsItem.author?.full_name || "Redação",
      "url": "https://melhoraprudente.com.br"
    }],
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Melhora Prudente",
      "logo": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=192&h=192"
      }
    },
    "timeRequired": `PT${readingTime}M`,
    "contentLocation": {
      "@type": "AdministrativeArea",
      "name": "Presidente Prudente, SP, Brasil"
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://melhoraprudente.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": newsItem.category || "Geral",
        "item": `https://melhoraprudente.com.br/categoria/${newsItem.category?.toLowerCase() || "geral"}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": newsItem.title,
        "item": `https://melhoraprudente.com.br/noticia/${newsItem.slug}`
      }
    ]
  };

  return (
    <article className="min-h-screen bg-white pb-20">
      <ViewTracker newsId={newsItem.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      {/* Detail Header / Top breadcrumb and title */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-6">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <ChevronRight size={12} className="text-zinc-300" />
            <Link href={`/categoria/${newsItem.category?.toLowerCase() || 'geral'}`} className="hover:text-red-600 transition-colors">{newsItem.category || 'Geral'}</Link>
            <ChevronRight size={12} className="text-zinc-300" />
            <span className="text-zinc-400 truncate max-w-[200px] md:max-w-[400px]">{newsItem.title}</span>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-red-600 font-bold text-sm mb-8 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o Portal
          </Link>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md shadow-red-600/15">
                {newsItem.category || 'Geral'}
              </span>
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold bg-zinc-100 px-3 py-1.5 rounded-full">
                <Clock size={12} className="text-zinc-400" />
                <span>Leitura: {readingTime} min</span>
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase bg-zinc-100 px-3 py-1.5 rounded-full">📍 Presidente Prudente</span>
            </div>
            
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
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 shadow-inner relative">
                  {newsItem.author?.avatar_url ? (
                    <Image 
                      src={newsItem.author.avatar_url} 
                      alt={newsItem.author.full_name || ''} 
                      fill
                      sizes="48px"
                      className="object-cover" 
                    />
                  ) : (
                    <User size={22} className="text-zinc-400" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-black text-zinc-950 uppercase tracking-tight">{newsItem.author?.full_name || 'Redação'}</p>
                  <p className="text-zinc-500 text-xs font-medium">Jornalista</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 font-semibold" suppressHydrationWarning>
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
          <div className="max-w-4xl mx-auto aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-xl shadow-zinc-200/40 border border-zinc-100 relative">
            <Image 
              src={newsItem.cover_image} 
              alt={newsItem.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              className="object-cover"
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
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatContentToHtml(newsItem.content)) }}
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
            
            <ShareWidget newsId={newsItem.id} newsTitle={newsItem.title} newsSlug={newsItem.slug} />
          </aside>
        </div>
      </div>
    </article>
  );
}
