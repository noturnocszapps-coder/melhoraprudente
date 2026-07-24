'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/types/news';
import { Clock, Tag, ExternalLink, ArrowRight, Flame } from 'lucide-react';

interface HeroBannerProps {
  article: NewsItem;
}

export function HeroBanner({ article }: HeroBannerProps) {
  if (!article) return null;

  const defaultImage =
    'https://picsum.photos/seed/prudente-hero/1200/675';
  const imageUrl = article.image_url || defaultImage;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl group border border-slate-200 bg-slate-900 text-white my-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px] lg:min-h-[480px]">
        {/* Background Image Container */}
        <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[320px] lg:min-h-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/60 lg:to-slate-950" />
          
          {/* Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Flame className="w-3.5 h-3.5" /> DESTAQUE PRINCIPAL
            </span>
            <span className="bg-slate-900/80 backdrop-blur-md text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
              {article.category || 'Cidade'}
            </span>
          </div>
        </div>

        {/* Content Box */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-slate-950 relative z-10 border-t lg:border-t-0 lg:border-l border-slate-800/80">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-slate-300" suppressHydrationWarning>
                <Clock className="w-3.5 h-3.5 text-red-500" />
                {new Date(article.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>•</span>
              <span className="text-red-400 font-semibold">
                {article.source_name || 'Melhora Prudente'}
              </span>
            </div>

            <Link href={`/noticia/${article.slug}`}>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-red-400 transition-colors line-clamp-3 leading-tight">
                {article.title}
              </h1>
            </Link>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 font-normal">
              {article.excerpt}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between mt-6">
            <Link
              href={`/noticia/${article.slug}`}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all group/btn"
            >
              <span>Ler Matéria Completa</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            {article.original_url && (
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Ver fonte original"
              >
                <span>Fonte Original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
