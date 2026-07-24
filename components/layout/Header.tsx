'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Search,
  Sun,
  User,
  ShieldCheck,
  Newspaper,
  Bell,
  X,
} from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
      setCurrentDate(formatted.charAt(0).toUpperCase() + formatted.slice(1));
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Bar with Info */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              Presidente Prudente, SP
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="hidden sm:flex items-center gap-1 text-slate-300" suppressHydrationWarning>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {currentDate || 'Carregando data...'}
            </span>
            <span className="hidden md:inline text-slate-700">•</span>
            <span className="hidden md:flex items-center gap-1 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              28°C Sol e Nuvens
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              <ShieldCheck className="w-3 h-3" /> Jornalismo Verificado
            </span>
            <Link
              href="/admin/login"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>Painel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Brand Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
                MELHORA<span className="text-red-600">.</span>
              </span>
              <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                PRUDENTE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-tight">
              A informação que melhora a nossa cidade
            </p>
          </div>
        </Link>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center relative w-64 lg:w-80"
          >
            <input
              type="text"
              placeholder="Buscar notícias de Prudente..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              className="w-full bg-slate-100 text-slate-800 text-sm pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (onSearch) onSearch('');
                }}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Abrir busca"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Input Overlay */}
      {isSearchOpen && (
        <div className="md:hidden p-3 bg-slate-100 border-t border-slate-200">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Pesquisar notícias..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              className="w-full bg-white text-slate-900 text-sm pl-9 pr-9 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
