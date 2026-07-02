'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Ban, LogOut, Loader2 } from 'lucide-react';

export function BlockedUserGuard({ children }: { children: React.ReactNode }) {
  const { isBlocked, loading, signOut } = useAuth();

  if (loading) {
    return <>{children}</>;
  }

  if (isBlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-zinc-50">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 text-center shadow-xl shadow-zinc-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Ban size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">Acesso Restrito</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Sua conta foi suspensa ou bloqueada pela administração do portal **Melhora Prudente** por violação dos termos de uso da comunidade.
            </p>
          </div>

          <div className="p-4 bg-red-50/50 rounded-2xl text-xs text-red-800 text-left leading-relaxed">
            Se você acredita que esta ação foi tomada por engano ou deseja solicitar a reavaliação do seu cadastro, entre em contato enviando um e-mail para suporte do portal.
          </div>

          <button
            onClick={() => signOut()}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <LogOut size={16} />
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
