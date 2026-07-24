'use client';

import React from 'react';
import { CategorySlug, CategoryInfo } from '@/types/news';
import { Layers, Flame, Building2, TrendingUp, Cpu, ShieldAlert, Sparkles, Compass } from 'lucide-react';

interface NavbarProps {
  activeCategory: CategorySlug;
  onSelectCategory: (category: CategorySlug) => void;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'todas', label: 'TUDO' },
  { id: 'cidade', label: 'CIDADE' },
  { id: 'economia', label: 'ECONOMIA' },
  { id: 'politica', label: 'POLÍTICA' },
  { id: 'seguranca', label: 'SEGURANÇA' },
  { id: 'inovacao', label: 'INOVAÇÃO' },
  { id: 'cultura', label: 'CULTURA' },
  { id: 'regiao', label: 'REGIÃO' },
];

export function Navbar({ activeCategory, onSelectCategory }: NavbarProps) {
  return (
    <nav className="bg-slate-900 text-slate-100 shadow-md sticky top-[80px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2.5 gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 ring-1 ring-red-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.id === 'todas' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                  {cat.id === 'cidade' && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                  {cat.id === 'economia' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                  {cat.id === 'inovacao' && <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                  {cat.id === 'seguranca' && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                  {cat.id === 'cultura' && <Sparkles className="w-3.5 h-3.5 text-pink-400" />}
                  {cat.id === 'regiao' && <Compass className="w-3.5 h-3.5 text-cyan-400" />}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
