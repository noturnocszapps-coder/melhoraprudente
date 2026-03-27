'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Fallback: Create profile if trigger fails or for immediate feedback
        // In a real production app, the trigger is more reliable, but this ensures the row exists.
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              email: email,
              role: 'user',
            },
          ]);
        
        // We ignore error here because it might already exist due to trigger
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      if (err.message === 'User already registered') {
        setError('Este e-mail já está cadastrado');
      } else {
        setError(err.message || 'Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-100">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Criar Conta</h1>
          <p className="mt-2 text-zinc-500 text-sm">Junte-se ao Melhora Prudente</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                placeholder="Seu Nome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                placeholder="Confirme sua senha"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Cadastrar'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-zinc-500">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-red-600 font-bold hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
