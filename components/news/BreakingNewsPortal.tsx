'use client';

import React from 'react';
import Link from 'next/link';
import { News } from '@/types';
import { motion } from 'motion/react';

interface BreakingNewsPortalProps {
  newsItems: News[];
}

export default function BreakingNewsPortal({ newsItems }: BreakingNewsPortalProps) {
  if (!newsItems || newsItems.length === 0) return null;

  return (
    <div id="breaking-news-portal-container" className="bg-red-600 text-white py-3 overflow-hidden border-b border-red-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="flex-shrink-0 bg-white text-red-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mr-4 animate-pulse">
          PLANTÃO
        </div>
        <div className="relative flex-1 overflow-hidden h-6 flex items-center">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="flex whitespace-nowrap gap-12 items-center"
          >
            {newsItems.map((item) => (
              <Link
                key={item.id}
                href={`/noticia/${item.slug}`}
                className="hover:text-zinc-200 text-sm font-black uppercase tracking-tight flex items-center gap-2"
              >
                <span className="text-red-300">•</span>
                {item.title}
              </Link>
            ))}
            {/* Duplicate for seamless looping */}
            {newsItems.map((item) => (
              <Link
                key={`dup-${item.id}`}
                href={`/noticia/${item.slug}`}
                className="hover:text-zinc-200 text-sm font-black uppercase tracking-tight flex items-center gap-2"
              >
                <span className="text-red-300">•</span>
                {item.title}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
