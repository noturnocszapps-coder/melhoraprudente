'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Loader2, Send, User } from 'lucide-react';
import { Comment } from '@/types';
import { formatDate } from '@/lib/utils';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles(full_name, avatar_url)')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          status: 'approved' // Auto-approve for now, or 'pending' if moderation is needed
        });

      if (error) throw error;
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <h3 className="text-xl font-black uppercase tracking-tighter">Comentários ({comments.length})</h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={20} className="text-zinc-400" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="O que você achou desta notícia?"
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-red-600 transition-all min-h-[100px]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 text-xs"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Comentar</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-50 p-6 rounded-2xl text-center space-y-3">
          <p className="text-zinc-500 text-sm">Você precisa estar logado para comentar.</p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="text-red-600 font-bold text-sm hover:underline">Entrar</Link>
            <span className="text-zinc-300">|</span>
            <Link href="/cadastro" className="text-red-600 font-bold text-sm hover:underline">Criar conta</Link>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="animate-spin text-red-600" size={24} />
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                {comment.user?.avatar_url ? (
                  <img src={comment.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={20} className="text-zinc-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{comment.user?.full_name || 'Usuário'}</span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-zinc-400 italic text-sm">Seja o primeiro a comentar!</p>
        )}
      </div>
    </div>
  );
}
