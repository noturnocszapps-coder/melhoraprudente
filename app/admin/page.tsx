'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { engagementService } from '@/services';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalCategories: 0,
    likesCount: 0,
    commentsCount: 0,
    viewsCount: 0,
    sharesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const safeCount = async (table: string, statusFilter?: { field: string, value: any }) => {
          try {
            let q = supabase.from(table).select('id', { count: 'exact', head: true });
            if (statusFilter) {
              q = q.eq(statusFilter.field, statusFilter.value);
            }
            const { count, error } = await q;
            if (error) throw error;
            return count || 0;
          } catch (e) {
            console.warn(`Could not fetch count for ${table}:`, e);
            return 0;
          }
        };

        const [postsCount, usersCount, categoriesCount, engagementMetrics] = await Promise.all([
          safeCount('news'),
          safeCount('profiles'),
          safeCount('categories'),
          engagementService.getEngagementMetrics()
        ]);

        setStats({
          totalPosts: postsCount,
          totalUsers: usersCount,
          totalCategories: categoriesCount,
          likesCount: engagementMetrics.likesCount,
          commentsCount: engagementMetrics.commentsCount,
          viewsCount: engagementMetrics.viewsCount,
          sharesCount: engagementMetrics.sharesCount
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando estatísticas...</p>
    </div>
  );

  const mainStats = [
    { label: 'Total de Notícias', value: stats.totalPosts.toString(), color: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { label: 'Usuários Registrados', value: stats.totalUsers.toString(), color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    { label: 'Categorias Ativas', value: stats.totalCategories.toString(), color: 'bg-purple-50 text-purple-600 border border-purple-100' },
  ];

  const engagementStats = [
    { label: 'Visualizações', value: stats.viewsCount.toString(), icon: Eye, color: 'bg-zinc-50 border border-zinc-200/60 text-zinc-800' },
    { label: 'Votos / Curtidas', value: stats.likesCount.toString(), icon: Heart, color: 'bg-red-50 border border-red-100 text-red-600' },
    { label: 'Comentários', value: stats.commentsCount.toString(), icon: MessageSquare, color: 'bg-amber-50 border border-amber-100 text-amber-600' },
    { label: 'Compartilhamentos', value: stats.sharesCount.toString(), icon: Share2, color: 'bg-indigo-50 border border-indigo-100 text-indigo-600' },
  ];

  return (
    <div className="space-y-10">
      {/* Overview Portal Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Estatísticas Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainStats.map((stat, i) => (
            <div key={i} className={cn("p-6 rounded-3xl space-y-2 shadow-sm transition-all hover:scale-[1.01]", stat.color)}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{stat.label}</p>
              <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Engine Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Radar de Engajamento Real</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {engagementStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={cn("p-6 rounded-3xl flex items-center justify-between shadow-sm transition-all hover:scale-[1.01]", stat.color)}>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-75">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/65 shadow-inner">
                  <Icon size={22} className="opacity-90" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-50 p-8 rounded-3xl space-y-4 border border-zinc-100/50">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/noticias/nova" className="bg-white p-5 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all text-center shadow-sm font-black text-xs uppercase tracking-wider text-zinc-800">
              Nova Notícia
            </Link>
            <Link href="/admin/categorias" className="bg-white p-5 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all text-center shadow-sm font-black text-xs uppercase tracking-wider text-zinc-800">
              Gerenciar Categorias
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
