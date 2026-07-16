'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { engagementService } from '@/services';
import { News } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AudienceWidget() {
  const [loading, setLoading] = useState(true);
  const [newsList, setNewsList] = useState<(News & { viewsCount: number })[]>([]);

  useEffect(() => {
    let active = true;
    async function fetchMostRead() {
      try {
        setLoading(true);
        const data = await engagementService.getMostReadLast24h(5);
        if (active) {
          setNewsList(data);
        }
      } catch (err) {
        console.error('Error fetching most read news for widget:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchMostRead();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 bg-zinc-200 rounded w-1/3 animate-pulse" />
            <div className="h-2 bg-zinc-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 items-start animate-pulse">
              <div className="w-6 h-6 bg-zinc-100 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-100 rounded w-5/6" />
                <div className="h-2 bg-zinc-50 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (newsList.length === 0) {
    return null;
  }

  // Determine if we have any real view data
  const hasRealViews = newsList.some(item => item.viewsCount > 0);

  const title = hasRealViews ? "Mais Lidas" : "Mais Recentes";
  const subtitle = hasRealViews ? "Últimas 24 horas" : "Últimas publicações";

  return (
    <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden">
      {/* Absolute subtle background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-red-500/[0.02] rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/10">
            {hasRealViews ? (
              <TrendingUp className="text-white" size={20} />
            ) : (
              <BookOpen className="text-white" size={20} />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black uppercase tracking-tight text-zinc-950 truncate leading-none mb-1.5">
              {title}
            </h4>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider truncate leading-none">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-5">
        {newsList.map((item, index) => (
          <div key={item.id} className="flex gap-4 items-start group relative min-w-0">
            {/* Rank number */}
            <span className="text-2xl font-black text-zinc-200 group-hover:text-red-600 transition-colors leading-none w-6 text-center flex-shrink-0 pt-0.5">
              {index + 1}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest flex-shrink-0">
                  {item.category || 'Geral'}
                </span>
                <span className="text-[9px] text-zinc-400 font-bold tracking-tight inline-flex items-center gap-0.5 flex-shrink-0">
                  <Clock size={10} />
                  {item.created_at ? formatDate(item.created_at) : 'Hoje'}
                </span>
              </div>

              <Link href={`/noticia/${item.slug}`} className="block">
                <h5 className="text-xs font-bold leading-snug text-zinc-800 group-hover:text-red-600 transition-colors line-clamp-2 break-words">
                  {item.title}
                </h5>
              </Link>

              {hasRealViews && item.viewsCount > 0 && (
                <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase">
                  <span>👁️ {item.viewsCount} {item.viewsCount === 1 ? 'leitura' : 'leituras'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
