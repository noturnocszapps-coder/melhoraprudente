'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function NewsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Erro ao excluir notícia.');
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando notícias...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar notícias..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="pb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Título</th>
              <th className="pb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Categoria</th>
              <th className="pb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Status</th>
              <th className="pb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Data</th>
              <th className="pb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <tr key={post.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 font-bold text-sm max-w-md truncate">{post.title}</td>
                  <td className="py-4 text-sm text-zinc-500">{post.category?.name || 'Sem categoria'}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "px-2 py-1 text-[10px] font-black uppercase rounded",
                        post.status === 'published' ? "bg-emerald-50 text-emerald-600" :
                        post.status === 'draft' ? "bg-zinc-100 text-zinc-500" :
                        "bg-amber-50 text-amber-600"
                      )}>
                        {post.status === 'published' ? 'Publicado' : 
                         post.status === 'draft' ? 'Rascunho' : 
                         post.status === 'review' ? 'Revisão' : 'Arquivado'}
                      </span>
                      {post.is_featured && (
                        <span className="px-2 py-1 text-[10px] font-black uppercase rounded bg-blue-50 text-blue-600">
                          Destaque
                        </span>
                      )}
                      {post.is_breaking && (
                        <span className="px-2 py-1 text-[10px] font-black uppercase rounded bg-red-50 text-red-600 animate-pulse">
                          Urgente
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-zinc-500">{formatDate(post.created_at)}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/noticias/editar/${post.id}`} className="text-zinc-400 hover:text-blue-600 transition-colors">
                        <Edit size={18} />
                      </Link>
                      <Link href={`/noticias/${post.slug}`} target="_blank" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                        <ExternalLink size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400 italic text-sm">
                  Nenhuma notícia encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
