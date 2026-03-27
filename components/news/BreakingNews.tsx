'use client';

import React from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { motion } from 'motion/react';

interface BreakingNewsProps {
  posts: Post[];
}

export default function BreakingNews({ posts }: BreakingNewsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div id="breaking-news-container" className="bg-red-600 text-white py-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="flex-shrink-0 bg-white text-red-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mr-4">
          Plantão
        </div>
        <div className="relative flex-1 overflow-hidden h-6">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="flex whitespace-nowrap gap-8 items-center"
          >
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/noticias/${post.slug}`}
                className="hover:underline text-sm font-medium"
              >
                {post.title}
              </Link>
            ))}
            {/* Duplicate for seamless loop if needed, but for now just a simple scroll */}
            {posts.map((post) => (
              <Link
                key={`dup-${post.id}`}
                href={`/noticias/${post.slug}`}
                className="hover:underline text-sm font-medium"
              >
                {post.title}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
