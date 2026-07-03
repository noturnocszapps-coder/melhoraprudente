'use client';

import React, { useState } from 'react';
import { MapPin, Globe, Compass, RefreshCw } from 'lucide-react';
import { NewsPortalCard } from './NewsPortalCard';
import { News } from '@/types';

interface GeoFilterFeedProps {
  initialNews: News[];
}

export default function GeoFilterFeed({ initialNews }: GeoFilterFeedProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const regions = [
    { code: 'ALL', name: 'Nacional & Geral', icon: Globe },
    { code: 'SP', name: 'São Paulo / Regional', icon: MapPin },
    { code: 'BR', name: 'Federal / DF', icon: Compass }
  ];

  const filteredNews = initialNews.filter(news => {
    if (selectedRegion === 'ALL') return true;
    return news.region === selectedRegion;
  });

  return (
    <div className="space-y-8">
      {/* Region Selector Bar */}
      <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-950">Cobertura Geo-Inteligente</h4>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Selecione sua região para personalizar o feed</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => {
            const Icon = r.icon;
            const isActive = selectedRegion === r.code;
            return (
              <button
                key={r.code}
                onClick={() => setSelectedRegion(r.code)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  isActive 
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-102' 
                    : 'bg-white text-zinc-600 hover:text-zinc-900 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-red-500' : 'text-zinc-400'} />
                {r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed List */}
      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredNews.slice(0, 8).map((newsItem) => (
            <div key={newsItem.id} className="relative transition-all duration-300 hover:translate-y-[-2px]">
              <NewsPortalCard news={newsItem} variant="default" />
              {/* Regional badge indicator */}
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="bg-zinc-950/85 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
                  <MapPin size={9} className="text-red-500 animate-pulse" />
                  {newsItem.region === 'BR' ? 'Brasília / Nacional' : `Região ${newsItem.region || 'SP'}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center space-y-4">
          <MapPin size={32} className="text-zinc-300 animate-bounce" />
          <div className="space-y-1">
            <p className="text-zinc-800 text-sm font-black uppercase tracking-wider">Nenhuma notícia local encontrada</p>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Tente selecionar outra região para receber cobertura</p>
          </div>
          <button
            onClick={() => setSelectedRegion('ALL')}
            className="text-xs bg-zinc-900 text-white hover:bg-zinc-800 font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            Ver Tudo
          </button>
        </div>
      )}
    </div>
  );
}
