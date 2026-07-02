'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, ExternalLink, Loader2, Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { News } from '@/types';
import { formatDate, cn } from '@/lib/utils';

export default function NewsList() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*, author:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = (data || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category || 'Geral',
        status: post.status === 'published' ? 'published' : 'draft',
        author: post.author,
        created_at: post.created_at
      }));

      setNewsList(mapped as any[]);
    } catch (error: any) {
      console.warn('Error fetching news from Supabase, loading from local cache:', error);
      const local = getStoredNewsList();
      setNewsList(local);
    } finally {
      setLoading(false);
    }
  };

  const getStoredNewsList = () => {
    if (typeof window === 'undefined') return [];
    try {
      const item = window.localStorage.getItem('mp_fallback_posts');
      if (item) {
        const posts = JSON.parse(item);
        return posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          category: post.category?.name || post.category_name || 'Geral',
          status: post.status === 'published' ? 'published' : 'draft',
          author: post.author || { full_name: 'Antônio Silva' },
          created_at: post.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;

    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
      setNewsList(prev => prev.filter(n => n.id !== id));
    } catch (error: any) {
      console.warn('Error deleting news from Supabase, attempting local delete:', error);
      if (typeof window !== 'undefined') {
        try {
          const item = window.localStorage.getItem('mp_fallback_posts');
          if (item) {
            const posts = JSON.parse(item);
            const filtered = posts.filter((p: any) => p.id !== id);
            window.localStorage.setItem('mp_fallback_posts', JSON.stringify(filtered));
          }
        } catch (e) {
          console.error(e);
        }
      }
      setNewsList(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredNews = newsList.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.excerpt && item.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando portal de notícias...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar notícias..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all outline-none"
          />
        </div>
        <Link 
          href="/admin/noticias/nova" 
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={16} />
          Nova Notícia
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Título</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Categoria</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Autor</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Data</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredNews.length > 0 ? (
                filteredNews.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-xs md:max-w-md">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-zinc-900 truncate" title={item.title}>
                          {item.title}
                        </span>
                        {item.excerpt && (
                          <span className="text-xs text-zinc-400 truncate max-w-sm mt-0.5">
                            {item.excerpt}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black uppercase rounded-full border tracking-wider flex items-center gap-1.5 w-fit",
                        item.status === 'published' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-zinc-100 text-zinc-600 border-zinc-200"
                      )}>
                        {item.status === 'published' ? (
                          <>
                            <CheckCircle size={10} /> Publicado
                          </>
                        ) : (
                          <>
                            <Clock size={10} /> Rascunho
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {item.author?.full_name || 'Desconhecido'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/noticias/editar/${item.id}`} 
                          title="Editar"
                          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <Link 
                          href={`/noticia/${item.slug}`} 
                          target="_blank" 
                          title="Visualizar"
                          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950 transition-colors"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          title="Excluir"
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                    Nenhuma notícia encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
