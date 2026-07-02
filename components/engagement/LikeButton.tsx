'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { engagementService } from '@/services';
import { motion } from 'motion/react';
import Link from 'next/link';

interface LikeButtonProps {
  newsId: string;
}

export default function LikeButton({ newsId }: LikeButtonProps) {
  const { user, isBlocked, isSuspended } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function loadLikes() {
      try {
        const count = await engagementService.getLikesCount(newsId);
        setLikesCount(count);

        if (user) {
          const hasLiked = await engagementService.hasUserLiked(newsId, user.id);
          setLiked(hasLiked);
        }
      } catch (err) {
        console.error('Error loading likes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLikes();
  }, [newsId, user]);

  const handleLike = async () => {
    if (!user) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    if (isBlocked || isSuspended) {
      return;
    }

    setToggling(true);
    try {
      const result = await engagementService.toggleLike(newsId, user.id);
      setLiked(result.liked);
      setLikesCount(result.count);
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setToggling(false);
    }
  };

  const isDisabled = isBlocked || isSuspended;

  return (
    <div className="relative inline-flex items-center gap-2">
      <motion.button
        id="like-button"
        onClick={handleLike}
        disabled={loading || toggling || isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.9 }}
        whileHover={{ scale: isDisabled ? 1 : 1.05 }}
        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm ${
          liked
            ? 'bg-red-50 border border-red-200 text-red-600 shadow-red-100/30'
            : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
        } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {loading ? (
          <Loader2 className="animate-spin text-zinc-400" size={16} />
        ) : (
          <Heart
            size={16}
            className={`transition-colors ${liked ? 'fill-red-600 text-red-600' : 'text-zinc-500'}`}
          />
        )}
        <span>{likesCount} {likesCount === 1 ? 'Curtida' : 'Curtidas'}</span>
      </motion.button>

      {/* Tooltip or Warning */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[10px] font-bold py-2 px-3 rounded-xl whitespace-nowrap shadow-xl z-20"
        >
          Você precisa{' '}
          <Link href="/login" className="underline text-red-400 hover:text-red-300">
            entrar
          </Link>{' '}
          para curtir!
        </motion.div>
      )}

      {/* Blocked or Suspended Warning */}
      {user && isDisabled && (
        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
          {isBlocked ? 'Acesso Restrito' : 'Conta Suspensa'}
        </span>
      )}
    </div>
  );
}
