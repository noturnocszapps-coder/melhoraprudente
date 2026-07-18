'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FolderTree, 
  MessageSquare, 
  Users, 
  Image as ImageIcon, 
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Search,
  Loader2,
  Menu,
  X,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AdminCacheProvider } from './context/AdminCacheContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, isEditor, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Prefetch admin pages for instant navigation
  React.useEffect(() => {
    router.prefetch('/admin');
    router.prefetch('/admin/noticias');
    router.prefetch('/admin/categorias');
    router.prefetch('/admin/comentarios');
    router.prefetch('/admin/usuarios');
    router.prefetch('/admin/anuncios');
    router.prefetch('/admin/configuracoes');
    router.prefetch('/admin/garimpo');
    router.prefetch('/');
  }, [router]);

  // Auto-close mobile drawer when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle body scroll locking when mobile menu is active
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !loading) {
      if (!profile) {
        router.push('/login');
      } else if (!isEditor) {
        router.push('/');
      }
    }
  }, [profile, loading, router, isEditor, mounted]);

  // Avoid hydration mismatch by waiting for mount. If already cached on client, bypass loading screen completely!
  if (!mounted || loading) {
    if (!mounted || !profile || !isEditor) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-red-600" size={40} />
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Verificando permissões...</p>
          </div>
        </div>
      );
    }
  }

  if (!profile || !isEditor) return null;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Notícias', path: '/admin/noticias' },
    { icon: Sparkles, label: 'Garimpo por IA', path: '/admin/garimpo' },
    { icon: FolderTree, label: 'Categorias', path: '/admin/categorias' },
    { icon: MessageSquare, label: 'Comentários', path: '/admin/comentarios' },
    { icon: Users, label: 'Usuários', path: '/admin/usuarios', adminOnly: true },
    { icon: ImageIcon, label: 'Anúncios', path: '/admin/anuncios', adminOnly: true },
    { icon: SettingsIcon, label: 'Configurações', path: '/admin/configuracoes', adminOnly: true },
  ];

  const filteredMenu = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <AdminCacheProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50">
        {/* Mobile Sticky Header */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-950 rounded-lg focus:outline-none transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-zinc-900 leading-none">
              MELHORA<span className="text-red-600">PRUDENTE</span>
            </span>
            <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-0.5">Admin</span>
          </Link>
        </div>
        
        <div className="text-xs font-semibold text-zinc-600 truncate max-w-[150px]">
          {profile.full_name?.split(' ')[0] || 'Usuário'}
        </div>
      </header>

      {/* Mobile Drawer (Backdrop & Sidebar Overlay) */}
      <div className={cn(
        "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto block" : "opacity-0 pointer-events-none hidden"
      )}>
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity duration-300" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sliding Sidebar Panel */}
        <aside className={cn(
          "absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Close Panel Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <Link href="/" className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-zinc-900 leading-none">
                MELHORA<span className="text-red-600">PRUDENTE</span>
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Painel Administrativo</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl transition-colors"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 mb-2 border-b border-zinc-100 pb-4"
            >
              <ArrowLeft size={20} />
              Voltar ao site
            </Link>
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  pathname === item.path 
                    ? "bg-red-50 text-red-600" 
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Footer of Mobile Drawer */}
          <div className="p-4 border-t border-zinc-100">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                signOut();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </aside>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 border-b border-zinc-100">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-zinc-900 leading-none">
              MELHORA<span className="text-red-600">PRUDENTE</span>
            </span>
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Painel Administrativo</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 mb-2 border-b border-zinc-100 pb-4"
          >
            <ArrowLeft size={20} />
            Voltar ao site
          </Link>
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                pathname === item.path 
                  ? "bg-red-50 text-red-600" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 min-w-0 w-full overflow-hidden">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-zinc-900">
              {menuItems.find(i => i.path === pathname)?.label || 'Painel'}
            </h1>
            <p className="text-zinc-500 text-xs md:text-sm">Bem-vindo, {profile.full_name || 'Usuário'}</p>
          </div>
          <Link 
            href="/admin/noticias/nova" 
            className="bg-zinc-900 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all w-full sm:w-auto shrink-0"
          >
            <Plus size={18} />
            Nova Notícia
          </Link>
        </header>

        <div className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200 p-4 md:p-8 shadow-sm">
          {children}
        </div>
      </main>
    </div>
    </AdminCacheProvider>
  );
}
