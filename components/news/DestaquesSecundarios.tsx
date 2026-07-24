'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem } from '@/types/news';
import { Clock, ArrowUpRight } from 'lucide-react';

interface DestaquesSecundariosProps {
  articles: NewsItem[];
}

export function DestaquesSecundarios({ articles }: DestaquesSecundariosProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-6 bg-red-600 rounded-sm inline-block" />
          DESTAQUES DA REGIÃO
        </h2>
        <span className="text-xs text-slate-500 font-medium">
          Presidente Prudente & Oeste Paulista
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((item, idx) => {
          const defaultImg = `https://picsum.photos/seed/prudente-destaque-${idx}/600/400`;
          const imageUrl = item.image_url || defaultImg;

          return (
            <article
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                      {item.category || 'Região'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    <span suppressHydrationWarning>
                      {new Date(item.published_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">
                      {item.source_name || 'Melhora Prudente'}
                    </span>
                  </div>

                  <Link href={`/noticia/${item.slug}`}>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/noticia/${item.slug}`}
                  className="text-xs font-bold text-red-600 group-hover:text-red-700 flex items-center gap-1"
                >
                  <span>Continuar lendo</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
