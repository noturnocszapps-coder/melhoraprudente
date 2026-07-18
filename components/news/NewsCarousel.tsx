'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { News } from '@/types';

interface NewsCarouselProps {
  newsItems: News[];
}

export default function NewsCarousel({ newsItems }: NewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set isMounted to true on client mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter and limit to 5-8 news
  const carouselItems = newsItems.slice(0, 8);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  useEffect(() => {
    if (carouselItems.length <= 1) return;

    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 5000); // 5 seconds autoplay
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, isHovered, carouselItems.length]);

  if (carouselItems.length === 0) {
    return null;
  }

  const currentItem = carouselItems[currentIndex];

  if (currentItem === undefined) {
    return null;
  }

  // State to handle images that might 404 upstream
  const [imgSrc, setImgSrc] = useState<string | null>(currentItem?.cover_image || null);

  useEffect(() => {
    if (currentItem) {
      setImgSrc(currentItem.cover_image || null);
    }
  }, [currentItem]);

  // Helper to format creation/publish time in Portuguese
  const formatTimeAgo = (dateStr: string) => {
    if (!isMounted) return 'Recentemente';
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 60) {
        return `Há ${Math.max(1, diffMins)} min`;
      } else if (diffHours < 24) {
        return `Há ${diffHours} h`;
      } else {
        const days = Math.floor(diffHours / 24);
        return `Há ${days} dia${days > 1 ? 's' : ''}`;
      }
    } catch {
      return 'Recentemente';
    }
  };

  return (
    <section 
      id="main-carousel"
      className="relative overflow-hidden bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-xl group aspect-[16/10] md:aspect-[21/9]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0.8, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative w-full h-full"
        >
          {/* News Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            {imgSrc ? (
              <Image
                src={imgSrc}
                alt={currentItem.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.75]"
                onError={() => {
                  setImgSrc(null);
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                {/* No image: let the professional charcoal gradient do the talking */}
              </div>
            )}
            {/* Multi-layered Vignette / Gradient Overlay to ensure maximum legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-900/10 z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 via-transparent to-transparent z-10 hidden md:block" />
          </div>

          {/* Content Overlays */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-6 md:p-10 flex flex-col justify-end h-full">
            <div className="max-w-3xl space-y-3">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-red-600/20 flex items-center gap-1">
                  <Sparkles size={10} className="animate-spin" />
                  Destaque
                </span>
                
                <span className="bg-white/15 backdrop-blur-md text-zinc-100 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                  {currentItem.category || 'Geral'}
                </span>

                {currentItem.city_name && (
                  <span className="bg-indigo-600/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/10">
                    📍 {currentItem.city_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <Link href={`/noticia/${currentItem.slug}`} className="block group/link">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight hover:text-red-400 transition-colors drop-shadow-md decoration-red-600 line-clamp-3">
                  {currentItem.title}
                </h2>
              </Link>

              {/* Excerpt */}
              {currentItem.excerpt && (
                <p className="text-zinc-300 text-xs md:text-sm font-medium leading-relaxed max-w-2xl line-clamp-2 drop-shadow-sm hidden sm:block">
                  {currentItem.excerpt}
                </p>
              )}

              {/* Publication details */}
              <div className="flex items-center gap-4 pt-1 text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider" suppressHydrationWarning>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-red-500" />
                  {formatTimeAgo(currentItem.created_at)}
                </span>
                {currentItem.viewsCount !== undefined && currentItem.viewsCount > 0 && (
                  <span>👁️ {currentItem.viewsCount} visualizações</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {carouselItems.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-red-600 text-white backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 hover:scale-100"
            aria-label="Notícia Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-red-600 text-white backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 hover:scale-100"
            aria-label="Próxima Notícia"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {carouselItems.length > 1 && (
        <div className="absolute right-6 bottom-6 md:right-10 md:bottom-10 z-30 flex gap-1.5 bg-black/20 p-2 rounded-full backdrop-blur-md border border-white/5">
          {carouselItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-red-600' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
