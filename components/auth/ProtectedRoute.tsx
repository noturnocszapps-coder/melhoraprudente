'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEditor?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  requireEditor = false 
}) => {
  const { user, profile, loading, isAdmin, isEditor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        router.push('/');
      } else if (requireEditor && !isEditor) {
        router.push('/');
      }
    }
  }, [user, profile, loading, isAdmin, isEditor, router, requireAdmin, requireEditor]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">Verificando permissões...</p>
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requireEditor && !isEditor) return null;

  return <>{children}</>;
};
