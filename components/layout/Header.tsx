'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200 shadow-sm">
      {/* Top Bar - Breaking News & Date */}
      <div className="bg-zinc-950 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-between gap-4 text-[10px] md:text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="bg-red-600 px-2 py-0.5 rounded text-[9px] animate-pulse whitespace-nowrap">Urgente</span>
            <div className="truncate max-w-[200px] md:max-w-md">
              <Link href="/noticias/exemplo" className="hover:text-red-400 transition-colors">
                Melhora Prudente: O novo portal de notícias da nossa região está no ar!
              </Link>
            </div>
          </div>
          <div className="hidden sm:block text-zinc-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-24">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex flex-col items-center lg:items-start absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            <span className="text-2xl md:text-4xl font-black tracking-tighter text-zinc-900 leading-none">
              MELHORA<span className="text-red-600">PRUDENTE</span>
            </span>
            <span className="hidden lg:block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">
              Notícias de Presidente Prudente e Região
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <Link href="/login" className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs md:text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-zinc-200">
              <User size={18} className="hidden md:block" />
              Entrar
            </Link>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-10 py-4 border-t border-zinc-100 text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500">
          <Link href="/" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Home</Link>
          <Link href="/categoria/politica" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Política</Link>
          <Link href="/categoria/economia" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Economia</Link>
          <Link href="/categoria/esportes" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Esportes</Link>
          <Link href="/categoria/cultura" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Cultura</Link>
          <Link href="/categoria/policia" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Polícia</Link>
          <Link href="/categoria/cidade" className="hover:text-red-600 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1">Cidade</Link>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-black tracking-tighter">
                  MELHORA<span className="text-red-600">PRUDENTE</span>
                </span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-zinc-400">
                  <Menu size={24} className="rotate-90" />
                </button>
              </div>
              
              <nav className="flex flex-col gap-6 text-lg font-black uppercase tracking-tighter">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:text-red-600">Home</Link>
                <Link href="/categoria/politica" onClick={() => setIsMenuOpen(false)} className="hover:text-red-600">Política</Link>
                <Link href="/categoria/economia" onClick={() => setIsMenuOpen(false)} className="hover:text-red-600">Economia</Link>
                <Link href="/categoria/esportes" onClick={() => setIsMenuOpen(false)} className="hover:text-red-600">Esportes</Link>
                <Link href="/categoria/cultura" onClick={() => setIsMenuOpen(false)} className="hover:text-red-600">Cultura</Link>
                <Link href="/categoria/policia" onClick={() => setIsMenuOpen(false)} className="hover:text-red-600">Polícia</Link>
              </nav>

              <div className="mt-auto pt-10 border-t border-zinc-100">
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  Entrar na Conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
