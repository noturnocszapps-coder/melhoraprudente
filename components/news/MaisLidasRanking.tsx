'use client';

import React from 'react';
import Link from 'next/link';
import { NewsItem } from '@/types/news';
import { TrendingUp, Flame, Eye } from 'lucide-react';

interface MaisLidasRankingProps {
  articles: NewsItem[];
}

export function MaisLidasRanking({ articles }: MaisLidasRankingProps) {
  if (!articles || articles.length === 0) return null;

  // Sort articles by views or fallback index
  const sorted = [...articles]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5);

  return (
    <aside className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          MAIS LIDAS DA SEMANA
        </h3>
        <span className="text-[10px] bg-red-600/30 text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase">
          Ranking Top 5
        </span>
      </div>

      <div className="space-y-4">
        {sorted.map((item, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <Link
              key={item.id}
              href={`/noticia/${item.slug}`}
              className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm shadow-sm ${
                  rank === 1
                    ? 'bg-amber-400 text-slate-950 font-extrabold ring-2 ring-amber-300/50'
                    : rank === 2
                    ? 'bg-slate-300 text-slate-950 font-extrabold'
                    : rank === 3
                    ? 'bg-amber-700 text-white font-extrabold'
                    : 'bg-slate-800 text-slate-400 font-bold'
                }`}
              >
                #{rank}
              </div>

              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                  {item.category || 'Cidade'}
                </span>
                <h4 className="font-bold text-sm text-slate-100 group-hover:text-red-300 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-3 h-3 text-slate-400" />
                    {item.views_count || (1000 - index * 180)} acessos
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
