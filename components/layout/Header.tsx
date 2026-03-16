'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200 shadow-sm">
      {/* Breaking News Bar */}
      <div className="bg-zinc-900 text-white py-1.5 px-4 overflow-hidden">
        <div className="container mx-auto flex items-center gap-4 text-xs font-medium">
          <span className="bg-red-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider animate-pulse">Urgente</span>
          <div className="flex-1 truncate">
            <Link href="/noticias/exemplo" className="hover:underline">
              Melhora Prudente: O novo portal de notícias da nossa região está no ar!
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col">
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-900 leading-none">
              MELHORA<span className="text-red-600">PRUDENTE</span>
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-0.5">
              Notícias de Presidente Prudente e Região
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
            <Link href="/categoria/politica" className="hover:text-red-600 transition-colors">Política</Link>
            <Link href="/categoria/economia" className="hover:text-red-600 transition-colors">Economia</Link>
            <Link href="/categoria/esportes" className="hover:text-red-600 transition-colors">Esportes</Link>
            <Link href="/categoria/cultura" className="hover:text-red-600 transition-colors">Cultura</Link>
            <Link href="/categoria/policia" className="hover:text-red-600 transition-colors">Polícia</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <Link href="/login" className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full text-sm font-bold transition-all">
              <User size={18} />
              Entrar
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-zinc-900"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-zinc-100 p-4 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-4 text-lg font-bold">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link href="/categoria/politica" onClick={() => setIsMenuOpen(false)}>Política</Link>
            <Link href="/categoria/economia" onClick={() => setIsMenuOpen(false)}>Economia</Link>
            <Link href="/categoria/esportes" onClick={() => setIsMenuOpen(false)}>Esportes</Link>
            <Link href="/categoria/cultura" onClick={() => setIsMenuOpen(false)}>Cultura</Link>
            <Link href="/categoria/policia" onClick={() => setIsMenuOpen(false)}>Polícia</Link>
            <hr className="border-zinc-100" />
            <Link href="/login" className="flex items-center gap-2 text-red-600" onClick={() => setIsMenuOpen(false)}>
              <User size={20} />
              Minha Conta
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
