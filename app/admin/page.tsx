'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    pendingComments: 0,
    totalUsers: 0,
    totalCategories: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [posts, comments, users, categories] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }),
          supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          totalPosts: posts.count || 0,
          pendingComments: comments.count || 0,
          totalUsers: users.count || 0,
          totalCategories: categories.count || 0
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

  const statCards = [
    { label: 'Total de Notícias', value: stats.totalPosts.toString(), color: 'bg-blue-50 text-blue-600' },
    { label: 'Comentários Pendentes', value: stats.pendingComments.toString(), color: 'bg-amber-50 text-amber-600' },
    { label: 'Usuários Registrados', value: stats.totalUsers.toString(), color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Categorias Ativas', value: stats.totalCategories.toString(), color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-2xl space-y-2", stat.color)}>
            <p className="text-xs font-black uppercase tracking-widest opacity-70">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-50 p-8 rounded-3xl space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/noticias/nova" className="bg-white p-4 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all text-center">
              <p className="text-xs font-bold text-zinc-600">Nova Notícia</p>
            </Link>
            <Link href="/admin/categorias" className="bg-white p-4 rounded-2xl border border-zinc-100 hover:border-red-200 transition-all text-center">
              <p className="text-xs font-bold text-zinc-600">Gerenciar Categorias</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
