'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, User, Bell, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const { user, profile, signOut, isAdmin, isEditor } = useAuth();

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
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2 md:px-4 py-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all border border-zinc-100"
                >
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs uppercase">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <span className="hidden md:block text-xs font-black uppercase tracking-wider text-zinc-900">
                    {profile?.full_name?.split(' ')[0] || 'Conta'}
                  </span>
                  <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", isUserMenuOpen && "rotate-180")} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-zinc-50 mb-2">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Logado como</p>
                        <p className="text-sm font-bold text-zinc-900 truncate">{user.email}</p>
                      </div>
                      
                      {(isAdmin || isEditor) && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-red-600 transition-colors"
                        >
                          <LayoutDashboard size={18} />
                          Painel Admin
                        </Link>
                      )}
                      
                      <button 
                        onClick={() => {
                          signOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs md:text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-zinc-200">
                <User size={18} className="hidden md:block" />
                Entrar
              </Link>
            )}
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
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm uppercase">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black uppercase tracking-wider truncate">{profile?.full_name || 'Usuário'}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    {(isAdmin || isEditor) && (
                      <Link 
                        href="/admin" 
                        className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest text-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LayoutDashboard size={20} />
                        Painel Admin
                      </Link>
                    )}

                    <button 
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-100 text-red-600 rounded-xl font-black uppercase tracking-widest text-sm"
                    >
                      <LogOut size={20} />
                      Sair da Conta
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/login" 
                    className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={20} />
                    Entrar na Conta
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
