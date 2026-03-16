import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, User, Share2, MessageCircle, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { newsService } from '@/services';
import { Metadata } from 'next';
import CommentSection from '@/components/CommentSection';
import AdSlot from '@/components/AdSlot';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await newsService.getPostBySlug(slug);
    if (!post) return { title: 'Notícia não encontrada' };

    return {
      title: `${post.title} | Melhora Prudente`,
      description: post.subtitle || post.excerpt || post.title,
      openGraph: {
        title: post.title,
        description: post.subtitle || post.excerpt || post.title,
        images: post.cover_image_url ? [post.cover_image_url] : [],
        type: 'article',
        publishedTime: post.published_at || undefined,
        authors: post.author?.full_name ? [post.author.full_name] : [],
      },
    };
  } catch (error) {
    return { title: 'Melhora Prudente' };
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  let post;

  try {
    post = await newsService.getPostBySlug(slug);
  } catch (error) {
    console.error('Error fetching post:', error);
    return notFound();
  }

  if (!post) return notFound();

  return (
    <article className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-red-600 font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={16} />
          Voltar para a Home
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          {post.category && (
            <Link href={`/categoria/${post.category.slug}`} className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
              {post.category.name}
            </Link>
          )}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 leading-tight tracking-tighter">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed">
              {post.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
                {post.author?.avatar_url ? (
                  <img src={post.author.avatar_url} alt={post.author.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-zinc-400" />
                )}
              </div>
              <div className="text-sm">
                <p className="font-bold text-zinc-900">{post.author?.full_name || 'Redação'}</p>
                <p className="text-zinc-500">Melhora Prudente</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Calendar size={18} />
              {formatDate(post.published_at || post.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.cover_image_url && (
        <div className="container mx-auto px-4 mb-12">
          <div className="max-w-5xl mx-auto aspect-[16/9] overflow-hidden rounded-3xl bg-zinc-100">
            <img 
              src={post.cover_image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex gap-4 mb-8 sticky top-24 float-left -ml-20 hidden xl:flex flex-col">
              <button className="p-3 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors">
                <Share2 size={20} />
              </button>
              <button className="p-3 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors">
                <MessageCircle size={20} />
              </button>
            </div>

            <div 
              className="prose prose-zinc prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-a:text-red-600"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Comments Section */}
            <div className="mt-16 pt-16 border-t border-zinc-100">
              <CommentSection postId={post.id} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <AdSlot position="sidebar_news_detail" />
            
            <div className="bg-zinc-50 p-6 rounded-3xl space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Mais lidas</h3>
              {/* This could be another service call for popular posts */}
              <p className="text-zinc-400 text-sm italic">Carregando tendências...</p>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
