'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { engagementService } from '@/services';
import { NewsComment } from '@/types';
import { formatDate } from '@/lib/utils';
import { Loader2, Send, CornerDownRight, User, Reply, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { checkRateLimit } from '@/lib/rateLimit';
import { trackEvent } from '@/lib/analytics';

interface CommentSectionProps {
  newsId?: string;
  postId?: string;
}

export default function CommentSection({ newsId, postId }: CommentSectionProps) {
  const { user, profile, isBlocked, isSuspended } = useAuth();
  const activeId = newsId || postId || '';
  
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for top-level comment
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // State for active replying
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    if (activeId) {
      fetchComments();
    }
  }, [activeId]);

  const fetchComments = async () => {
    try {
      const data = await engagementService.getComments(activeId);
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isBlocked || isSuspended || !newComment.trim() || !activeId) return;

    setSubmitting(true);
    const limitResult = checkRateLimit(`comment:${user.id}`, 5, 60000, true);
    if (limitResult.limited) {
      alert(`Você está enviando comentários muito rápido. Por favor, aguarde ${Math.ceil(limitResult.resetMs / 1000)} segundos.`);
      setSubmitting(false);
      return;
    }

    try {
      await engagementService.createComment(activeId, user.id, newComment.trim(), null);
      trackEvent('comentario', { category: 'Engajamento', news_id: activeId, type: 'novo' });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      trackEvent('comentario_erro', { category: 'Erros', news_id: activeId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!user || isBlocked || isSuspended || !replyContent.trim() || !activeId) return;

    setReplySubmitting(true);
    const limitResult = checkRateLimit(`comment:${user.id}`, 5, 60000, true);
    if (limitResult.limited) {
      alert(`Você está enviando respostas muito rápido. Por favor, aguarde ${Math.ceil(limitResult.resetMs / 1000)} segundos.`);
      setReplySubmitting(false);
      return;
    }

    try {
      await engagementService.createComment(activeId, user.id, replyContent.trim(), parentId);
      trackEvent('comentario', { category: 'Engajamento', news_id: activeId, type: 'resposta', parent_id: parentId });
      setReplyContent('');
      setActiveReplyId(null);
      await fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
      trackEvent('comentario_erro', { category: 'Erros', news_id: activeId, type: 'resposta' });
    } finally {
      setReplySubmitting(false);
    }
  };

  const countTotalComments = (items: NewsComment[]): number => {
    let count = 0;
    const traverse = (list: NewsComment[]) => {
      list.forEach(item => {
        count++;
        if (item.replies && item.replies.length > 0) {
          traverse(item.replies);
        }
      });
    };
    traverse(items);
    return count;
  };

  const totalCount = countTotalComments(comments);

  // Render a comment and recursively its replies
  const renderCommentNode = (comment: NewsComment, depth = 0) => {
    const isReplying = activeReplyId === comment.id;
    const maxDepth = 4; // limit visually indented depth to prevent layout breaks on small screens
    const currentDepth = Math.min(depth, maxDepth);

    return (
      <div key={comment.id} className="space-y-4" id={`comment-${comment.id}`}>
        <div 
          className={`flex gap-4 p-4 rounded-2xl border transition-all ${
            depth > 0 
              ? 'bg-zinc-50/50 border-zinc-100/80 ml-4 md:ml-12' 
              : 'bg-white border-zinc-100 shadow-sm shadow-zinc-100/50'
          }`}
        >
          {depth > 0 && (
            <div className="flex-shrink-0 text-zinc-300 self-start mt-1">
              <CornerDownRight size={16} />
            </div>
          )}
          
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-200">
            {comment.user?.avatar_url ? (
              <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-zinc-400" />
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-zinc-900">{comment.user?.full_name || 'Leitor do Portal'}</span>
              
              {comment.user?.role && comment.user.role !== 'user' && (
                <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                  {comment.user.role === 'admin' ? 'Admin' : 'Editor'}
                </span>
              )}

              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider ml-auto" suppressHydrationWarning>
                {formatDate(comment.created_at)}
              </span>
            </div>

            <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>

            {/* Interaction Options */}
            {user && !isBlocked && !isSuspended && (
              <div className="flex gap-4 pt-1">
                <button
                  onClick={() => {
                    if (isReplying) {
                      setActiveReplyId(null);
                    } else {
                      setActiveReplyId(comment.id);
                      setReplyContent('');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                >
                  <Reply size={12} />
                  Responder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply Submission Form */}
        <AnimatePresence>
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`overflow-hidden ${depth > 0 ? 'ml-8 md:ml-16' : 'ml-4 md:ml-12'}`}
            >
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Reply size={10} /> Respondendo a {comment.user?.full_name || 'Leitor'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(null)}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  rows={2}
                  className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-xs focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(null)}
                    className="px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-zinc-700 uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={replySubmitting || !replyContent.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 text-[10px]"
                  >
                    {replySubmitting ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <>
                        <Send size={12} /> Responder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recursive Children (Replies) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8" id="comments-section">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
          <MessageSquare className="text-red-600" size={20} />
          Comentários ({totalCount})
        </h3>
      </div>

      {/* Main Form for Posting Top-Level Comment */}
      {user ? (
        isBlocked ? (
          <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-wider">
            Sua conta está bloqueada pela administração e você não pode realizar interações.
          </div>
        ) : isSuspended ? (
          <div className="bg-amber-50 text-amber-800 border border-amber-100 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-wider">
            Sua conta está suspensa temporariamente. O envio de novos comentários e respostas está desabilitado.
          </div>
        ) : (
          <form onSubmit={handleSubmitComment} className="space-y-4 bg-zinc-50/55 p-6 rounded-3xl border border-zinc-100">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-200">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-zinc-400" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-xs">
                  <span className="font-bold text-zinc-800">{profile?.full_name || 'Leitor'}</span>
                  <span className="text-zinc-400 font-medium"> (comentando publicamente)</span>
                </div>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Escreva sua opinião sincera e construtiva sobre esta notícia..."
                  rows={3}
                  className="w-full bg-white border border-zinc-200 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all resize-none shadow-inner"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 text-xs shadow-md shadow-red-600/10"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Publicar Comentário</>}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )
      ) : (
        <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-[2rem] text-center space-y-4">
          <p className="text-zinc-500 text-sm font-semibold">Deseja participar do debate público? Faça login para comentar.</p>
          <div className="flex justify-center items-center gap-4 text-xs font-black uppercase tracking-wider">
            <Link href="/login" className="bg-zinc-900 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all shadow">
              Entrar
            </Link>
            <span className="text-zinc-300">ou</span>
            <Link href="/cadastro" className="text-red-600 hover:underline">
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      )}

      {/* Render Threaded Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-red-600" size={28} />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map(comment => renderCommentNode(comment))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-50/30 rounded-[2rem] border border-dashed border-zinc-200/60">
            <p className="text-zinc-400 italic text-sm font-medium">Seja o primeiro a expressar sua opinião sobre esta matéria!</p>
          </div>
        )}
      </div>
    </div>
  );
}
