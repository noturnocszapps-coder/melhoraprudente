'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Trash2, Loader2, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Comment } from '@/types';

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    setLoading(true);
    let query = supabase
      .from('comments')
      .select('*, posts(title), user:profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    
    if (error) console.error('Error fetching comments:', error);
    else setComments(data || []);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', id);
    
    if (error) alert('Erro ao atualizar status do comentário');
    else fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este comentário?')) return;
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) alert('Erro ao excluir comentário');
    else fetchComments();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tighter uppercase">Comentários</h1>
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-red-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovados' : f === 'rejected' ? 'Rejeitados' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-red-600" size={32} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando comentários...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-zinc-100">
          <MessageSquare className="mx-auto text-zinc-200" size={48} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Nenhum comentário encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 overflow-hidden">
                    {comment.user?.avatar_url ? (
                      <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{comment.user?.full_name || 'Usuário'}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {comment.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'approved')}
                      className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                      title="Aprovar"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  {comment.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'rejected')}
                      className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all"
                      title="Rejeitar"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl">
                <p className="text-sm text-zinc-700 leading-relaxed">{comment.content}</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <span>Em:</span>
                <span className="text-zinc-900">{(comment as any).posts?.title || 'Notícia excluída'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
