'use client';

import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { Post } from '@/types';

interface NewsCardProps {
  post: Partial<Post>;
  variant?: 'default' | 'horizontal' | 'compact' | 'featured';
  className?: string;
}

export const NewsCard = ({ post, variant = 'default', className }: NewsCardProps) => {
  const {
    title,
    subtitle,
    slug,
    cover_image_url,
    category,
    published_at,
    author
  } = post;

  if (variant === 'featured') {
    return (
      <Link 
        href={`/noticias/${slug}`} 
        className={cn("group relative block aspect-[16/9] overflow-hidden rounded-[2rem] bg-zinc-900 shadow-2xl shadow-zinc-200/50", className)}
      >
        <img 
          src={cover_image_url || 'https://picsum.photos/seed/news/1200/800'} 
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        <div className="absolute bottom-0 p-6 md:p-12 w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg shadow-red-600/20">
              {category?.name || 'Destaque'}
            </span>
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              {published_at ? formatDate(published_at) : 'Hoje'}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter mb-6 group-hover:text-red-500 transition-colors">
            {title}
          </h2>
          <p className="text-zinc-300 text-sm md:text-lg font-medium line-clamp-2 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link 
        href={`/noticias/${slug}`} 
        className={cn("group flex gap-6 md:gap-8 items-start py-6 border-b border-zinc-100 last:border-0", className)}
      >
        <div className="relative h-28 w-36 md:h-40 md:w-64 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
          <img 
            src={cover_image_url || 'https://picsum.photos/seed/news/400/300'} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 space-y-3">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">
            {category?.name}
          </span>
          <h3 className="text-lg md:text-2xl font-black text-zinc-900 leading-tight tracking-tighter group-hover:text-red-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="hidden md:block text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2">
            {subtitle}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            <span>{author?.full_name || 'Redação'}</span>
            <span>•</span>
            <span>{published_at ? formatDate(published_at) : 'Recentemente'}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link 
        href={`/noticias/${slug}`} 
        className={cn("group flex gap-4 items-center py-4 border-b border-zinc-100 last:border-0", className)}
      >
        <div className="flex-1 space-y-1.5">
          <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">
            {category?.name}
          </span>
          <h3 className="text-sm md:text-base font-black text-zinc-900 leading-tight tracking-tight group-hover:text-red-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/noticias/${slug}`} 
      className={cn("group block space-y-5", className)}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-zinc-100 shadow-md">
        <img 
          src={cover_image_url || 'https://picsum.photos/seed/news/600/400'} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="space-y-3">
        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">
          {category?.name}
        </span>
        <h3 className="text-xl md:text-2xl font-black text-zinc-900 leading-[1.1] tracking-tighter group-hover:text-red-600 transition-colors">
          {title}
        </h3>
        <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2">
          {subtitle}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-2">
          <span>{author?.full_name || 'Redação'}</span>
          <span>•</span>
          <span>{published_at ? formatDate(published_at) : 'Recentemente'}</span>
        </div>
      </div>
    </Link>
  );
};
