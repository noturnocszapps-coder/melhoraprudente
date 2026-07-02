'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageSquare, Flame, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { engagementService } from '@/services';
import { News } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'trending' | 'commented' | 'today';

export default function TrendingWidget() {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [loading, setLoading] = useState(true);
  
  const [trendingNews, setTrendingNews] = useState<any[]>([]);
  const [mostCommented, setMostCommented] = useState<any[]>([]);
  const [trendingToday, setTrendingToday] = useState<any[]>([]);

  useEffect(() => {
    async function loadTrendingData() {
      try {
        setLoading(true);
        // Get trending news from our service
        const trending = await engagementService.getTrendingNews(6);
        setTrendingNews(trending);

        // Calculate "Mais Comentadas"
        const sortedByComments = [...trending].sort((a, b) => b.commentsCount - a.commentsCount);
        setMostCommented(sortedByComments);

        // Calculate "Trending Hoje" (published in last 48 hours, sorted by score)
        const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
        const filteredToday = trending.filter(news => new Date(news.created_at).getTime() >= fortyEightHoursAgo);
        setTrendingToday(filteredToday.length > 0 ? filteredToday : trending.slice(0, 3));
      } catch (err) {
        console.error('Error fetching trending data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrendingData();
  }, []);

  const getActiveList = () => {
    switch (activeTab) {
      case 'trending':
        return trendingNews;
      case 'commented':
        return mostCommented;
      case 'today':
        return trendingToday;
      default:
        return trendingNews;
    }
  };

  const currentList = getActiveList();

  return (
    <section id="trending-widget" className="bg-zinc-950 text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-zinc-950/20 border border-zinc-900 overflow-hidden relative">
      {/* Absolute decorative glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6">
        {/* Widget Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
            <TrendingUp className="text-white animate-pulse" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">Radar de Engajamento</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">O que repercute em Presidente Prudente</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('trending')}
            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'trending'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Em Alta
          </button>
          <button
            onClick={() => setActiveTab('commented')}
            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'commented'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Comentadas
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'today'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hoje
          </button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="animate-spin text-red-500" size={24} />
          </div>
        ) : currentList.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {currentList.map((item, index) => (
                  <div key={item.id} className="flex gap-4 items-start group relative">
                    <span className="text-3xl font-black text-zinc-800 group-hover:text-red-500 transition-colors leading-none w-8 text-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block">
                          {item.category || 'Geral'}
                        </span>
                        
                        {/* Metrics Badge */}
                        <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase ml-auto">
                          {item.likesCount > 0 && (
                            <span className="flex items-center gap-0.5 text-red-500/80">
                              ❤️ {item.likesCount}
                            </span>
                          )}
                          {item.commentsCount > 0 && (
                            <span className="flex items-center gap-0.5 text-zinc-400">
                              💬 {item.commentsCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/noticia/${item.slug}`} className="block">
                        <h4 className="text-xs font-bold leading-snug text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </Link>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-center py-10 text-zinc-500 text-xs italic">Nenhum engajamento registrado hoje.</p>
        )}
      </div>
    </section>
  );
}
