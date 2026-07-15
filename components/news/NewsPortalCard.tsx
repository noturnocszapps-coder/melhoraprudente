'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatDate } from '@/lib/utils';
import { News } from '@/types';

interface NewsPortalCardProps {
  news: Partial<News>;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export const NewsPortalCard = ({ news, variant = 'default', className }: NewsPortalCardProps) => {
  const {
    title,
    excerpt,
    slug,
    cover_image,
    category,
    created_at,
    author
  } = news;

  const defaultImage = 'https://picsum.photos/seed/news/800/600';
  const [imgSrc, setImgSrc] = useState<string>(cover_image || defaultImage);

  // Sync image source if news object changes dynamically
  useEffect(() => {
    setImgSrc(cover_image || defaultImage);
  }, [cover_image]);

  if (variant === 'featured') {
    return (
      <Link 
        href={`/noticia/${slug}`} 
        className={cn("group relative block aspect-[16/9] overflow-hidden rounded-[2rem] bg-zinc-900 shadow-2xl shadow-zinc-200/50", className)}
      >
        <Image 
          src={imgSrc} 
          alt={title || 'Notícia em Destaque'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-102 opacity-80"
          onError={() => setImgSrc(defaultImage)}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        <div className="absolute bottom-0 p-6 md:p-12 w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-red-600/20">
              {category || 'Geral'}
            </span>
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest" suppressHydrationWarning>
              {created_at ? formatDate(created_at) : 'Hoje'}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.0] tracking-tighter mb-6 group-hover:text-red-500 transition-colors">
            {title}
          </h2>
          <p className="text-zinc-300 text-sm md:text-lg font-medium line-clamp-2 max-w-3xl leading-relaxed">
            {excerpt}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link 
        href={`/noticia/${slug}`} 
        className={cn("group flex gap-4 items-start py-4 border-b border-zinc-100 last:border-0", className)}
      >
        {cover_image && (
          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100">
            <Image 
              src={imgSrc} 
              alt={title || 'Notícia Compacta'}
              fill
              sizes="96px"
              className="h-full w-full object-cover transition-transform duration-75 group-hover:scale-105"
              onError={() => setImgSrc(defaultImage)}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">
            {category || 'Geral'}
          </span>
          <h3 className="text-sm font-black text-zinc-900 leading-tight tracking-tight group-hover:text-red-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <span className="text-[10px] text-zinc-400 font-bold block" suppressHydrationWarning>
            {created_at ? formatDate(created_at) : 'Hoje'}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/noticia/${slug}`} 
      className={cn("group block space-y-5", className)}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-zinc-100 shadow-md">
        <Image 
          src={imgSrc} 
          alt={title || 'Notícia'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgSrc(defaultImage)}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="space-y-3">
        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">
          {category || 'Geral'}
        </span>
        <h3 className="text-xl md:text-2xl font-black text-zinc-900 leading-[1.1] tracking-tighter group-hover:text-red-600 transition-colors">
          {title}
        </h3>
        {excerpt && (
          <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-2" suppressHydrationWarning>
          <span>{author?.full_name || 'Redação'}</span>
          <span>•</span>
          <span>{created_at ? formatDate(created_at) : 'Recentemente'}</span>
        </div>
      </div>
    </Link>
  );
};
