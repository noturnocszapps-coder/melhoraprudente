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
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, isRedator, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push('/login');
      } else if (!isRedator) {
        router.push('/');
      }
    }
  }, [profile, loading, router, isRedator]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Verificando permissões...</p>
      </div>
    </div>
  );

  if (!profile || !isRedator) return null;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: FileText, label: 'Notícias', path: '/admin/noticias' },
    { icon: FolderTree, label: 'Categorias', path: '/admin/categorias' },
    { icon: MessageSquare, label: 'Comentários', path: '/admin/comentarios' },
    { icon: Users, label: 'Usuários', path: '/admin/usuarios', adminOnly: true },
    { icon: ImageIcon, label: 'Anúncios', path: '/admin/anuncios', adminOnly: true },
    { icon: SettingsIcon, label: 'Configurações', path: '/admin/configuracoes', adminOnly: true },
  ];

  const filteredMenu = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-zinc-100">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-zinc-900 leading-none">
              MELHORA<span className="text-red-600">PRUDENTE</span>
            </span>
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Painel Administrativo</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              {menuItems.find(i => i.path === pathname)?.label || 'Painel'}
            </h1>
            <p className="text-zinc-500 text-sm">Bem-vindo, {profile.full_name}</p>
          </div>
          <Link href="/admin/noticias/nova" className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all">
            <Plus size={18} />
            Nova Notícia
          </Link>
        </header>

        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
