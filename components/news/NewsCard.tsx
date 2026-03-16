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
        className={cn("group relative block aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-900", className)}
      >
        <img 
          src={cover_image_url || 'https://picsum.photos/seed/news/1200/800'} 
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-70"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 p-6 md:p-10 w-full">
          <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-4">
            {category?.name || 'Destaque'}
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter mb-4 group-hover:underline">
            {title}
          </h2>
          <p className="text-zinc-300 text-sm md:text-base line-clamp-2 max-w-2xl">
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
        className={cn("group flex gap-4 md:gap-6 items-start", className)}
      >
        <div className="relative h-24 w-32 md:h-32 md:w-48 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100">
          <img 
            src={cover_image_url || 'https://picsum.photos/seed/news/400/300'} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 space-y-2">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
            {category?.name}
          </span>
          <h3 className="text-base md:text-xl font-bold text-zinc-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="hidden md:block text-zinc-500 text-sm line-clamp-2">
            {subtitle}
          </p>
          <div className="text-[10px] text-zinc-400 font-medium">
            {published_at ? formatDate(published_at) : 'Recentemente'}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/noticias/${slug}`} 
      className={cn("group block space-y-4", className)}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100">
        <img 
          src={cover_image_url || 'https://picsum.photos/seed/news/600/400'} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="space-y-2">
        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
          {category?.name}
        </span>
        <h3 className="text-xl font-black text-zinc-900 leading-tight group-hover:text-red-600 transition-colors">
          {title}
        </h3>
        <p className="text-zinc-500 text-sm line-clamp-2">
          {subtitle}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium pt-2">
          <span>{author?.full_name || 'Redação'}</span>
          <span>•</span>
          <span>{published_at ? formatDate(published_at) : 'Recentemente'}</span>
        </div>
      </div>
    </Link>
  );
};
