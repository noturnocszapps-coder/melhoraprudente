'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsItem, CategorySlug } from '@/types/news';
import { Clock, Eye, Share2, ArrowRight, Newspaper, Filter } from 'lucide-react';

interface GridNoticiasProps {
  articles: NewsItem[];
  activeCategory: CategorySlug;
  searchQuery?: string;
  onSelectCategory: (cat: CategorySlug) => void;
}

export function GridNoticias({
  articles,
  activeCategory,
  searchQuery,
  onSelectCategory,
}: GridNoticiasProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  // Filter articles based on active category and search query
  const filtered = articles.filter((item) => {
    const matchCat =
      activeCategory === 'todas'
        ? true
        : item.category.toLowerCase().includes(activeCategory.toLowerCase());

    const matchSearch = searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchCat && matchSearch;
  });

  const visibleArticles = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section className="my-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b-2 border-slate-900">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-red-600" />
            FEED DE NOTÍCIAS
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {searchQuery
              ? `Resultados para "${searchQuery}"`
              : 'Últimas atualizações jornalísticas em tempo real'}
          </p>
        </div>

        {/* Filter badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Exibindo:</span>
          <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-200 uppercase">
            {activeCategory} ({filtered.length})
          </span>
        </div>
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            Nenhuma notícia encontrada
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Não encontramos matérias para a categoria selecionada ou para os termos da busca.
          </p>
          <button
            onClick={() => onSelectCategory('todas')}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Ver todas as notícias
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleArticles.map((item, index) => {
            const defaultImg = `https://picsum.photos/seed/prudente-grid-${index}/600/400`;
            const imageUrl = item.image_url || defaultImg;

            return (
              <article
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider shadow">
                        {item.category || 'Geral'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      <span suppressHydrationWarning>
                        {new Date(item.published_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600 font-semibold">
                        {item.source_name || 'Melhora Prudente'}
                      </span>
                    </div>

                    <Link href={`/noticia/${item.slug}`}>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-3.5 h-3.5" />
                    {item.views_count ?? (index * 47 + 85)}
                  </span>

                  <Link
                    href={`/noticia/${item.slug}`}
                    className="font-bold text-slate-800 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <span>Ler matéria</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-2"
          >
            <span>Carregar mais notícias</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
