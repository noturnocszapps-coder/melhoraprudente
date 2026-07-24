'use client';

import React from 'react';
import Link from 'next/link';
import { NewsItem } from '@/types/news';
import { Radio, ChevronRight, Clock } from 'lucide-react';

interface PlantaoTickerProps {
  newsItems: NewsItem[];
}

export function PlantaoTicker({ newsItems }: PlantaoTickerProps) {
  if (!newsItems || newsItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 text-white border-b border-red-900/50 py-2.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        {/* Badge */}
        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shrink-0 shadow-sm animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          <span>PLANTÃO PRUDENTE</span>
        </div>

        {/* Ticker items */}
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-6 text-xs sm:text-sm">
          {newsItems.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/noticia/${item.slug}`}
              className="flex items-center gap-2 hover:text-red-300 transition-colors shrink-0 group"
            >
              <span className="text-red-400 font-mono text-xs flex items-center gap-1" suppressHydrationWarning>
                <Clock className="w-3 h-3 text-red-500" />
                {new Date(item.published_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="font-semibold text-slate-200 group-hover:underline line-clamp-1 max-w-md">
                {item.title}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-red-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
