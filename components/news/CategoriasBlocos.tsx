'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/types/news';
import { Building2, Cpu, TrendingUp, ChevronRight, Clock } from 'lucide-react';

interface CategoriasBlocosProps {
  articles: NewsItem[];
}

export function CategoriasBlocos({ articles }: CategoriasBlocosProps) {
  if (!articles || articles.length === 0) return null;

  // Filter articles into thematic blocks
  const cidadeNews = articles.filter(
    (a) => a.category.toLowerCase().includes('cidade') || a.source_name?.toLowerCase().includes('prefeitura')
  );
  const inovacaoNews = articles.filter(
    (a) => a.category.toLowerCase().includes('inova') || a.source_name?.toLowerCase().includes('inova')
  );
  const economiaNews = articles.filter(
    (a) => a.category.toLowerCase().includes('econo') || a.category.toLowerCase().includes('polít')
  );

  const blocks = [
    {
      id: 'cidade',
      title: 'CIDADE & COMUNIDADE',
      icon: Building2,
      color: 'border-blue-600 text-blue-600',
      badgeColor: 'bg-blue-600',
      items: cidadeNews.length > 0 ? cidadeNews : articles.slice(0, 3),
    },
    {
      id: 'inovacao',
      title: 'INOVAÇÃO & TECNOLOGIA',
      icon: Cpu,
      color: 'border-purple-600 text-purple-600',
      badgeColor: 'bg-purple-600',
      items: inovacaoNews.length > 0 ? inovacaoNews : articles.slice(1, 4),
    },
    {
      id: 'economia',
      title: 'ECONOMIA & NEGÓCIOS',
      icon: TrendingUp,
      color: 'border-emerald-600 text-emerald-600',
      badgeColor: 'bg-emerald-600',
      items: economiaNews.length > 0 ? economiaNews : articles.slice(2, 5),
    },
  ];

  return (
    <section className="my-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {blocks.map((block) => {
          const Icon = block.icon;
          const mainArticle = block.items[0];
          const subArticles = block.items.slice(1, 3);

          if (!mainArticle) return null;

          return (
            <div
              key={block.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between pb-3 border-b-2 ${block.color}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm tracking-wider text-slate-900">
                    {block.title}
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Main Lead Article in Block */}
              <div className="group">
                <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                  <Image
                    src={
                      mainArticle.image_url ||
                      `https://picsum.photos/seed/block-${block.id}/500/300`
                    }
                    alt={mainArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`${block.badgeColor} text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider`}
                    >
                      {mainArticle.category || block.id}
                    </span>
                  </div>
                </div>

                <Link href={`/noticia/${mainArticle.slug}`}>
                  <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                    {mainArticle.title}
                  </h4>
                </Link>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {mainArticle.excerpt}
                </p>
              </div>

              {/* Secondary List in Block */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {subArticles.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/noticia/${sub.slug}`}
                    className="block group/sub"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-slate-800 group-hover/sub:text-red-600 transition-colors line-clamp-2 leading-tight">
                        • {sub.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(sub.published_at).toLocaleDateString(
                          'pt-BR',
                          { day: '2-digit', month: '2-digit' }
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
