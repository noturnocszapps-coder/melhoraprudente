'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isBlocked: boolean;
  isSuspended: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isEditor: false,
  isBlocked: false,
  isSuspended: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('mp_auth_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('mp_user_profile');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedUser = window.localStorage.getItem('mp_auth_user');
      const storedProfile = window.localStorage.getItem('mp_user_profile');
      if (storedUser && storedProfile) {
        return false; // Load instantly if cached
      }
    }
    return true;
  });

  // Keep refs to avoid stale closure issues in the single-run useEffect
  const profileRef = React.useRef<Profile | null>(null);
  profileRef.current = profile;

  useEffect(() => {
    let isMounted = true;
    let lastFetchedUserId: string | null = user?.id || null;
    let isFetching = false;

    const fetchProfileData = async (userId: string) => {
      if (isFetching) return;
      isFetching = true;
      lastFetchedUserId = userId;

      try {
        console.log('useAuth: Iniciando busca do perfil para o ID:', userId);
        
        // Verificar se há uma sessão ativa antes de fazer a consulta para evitar erros de RLS
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          console.log('useAuth: Nenhuma sessão ativa detectada ao tentar buscar o perfil. Cancelando busca.');
          if (isMounted) {
            setUser(null);
            setProfile(null);
            window.localStorage.removeItem('mp_auth_user');
            window.localStorage.removeItem('mp_user_profile');
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          // Se for erro de permissão (RLS) ou JWT expirado, não lançar console.error assustador
          console.warn('useAuth: Perfil não encontrado ou sem autorização:', error.message);
          if (isMounted) {
            setProfile(null);
            window.localStorage.removeItem('mp_user_profile');
          }
        } else {
          console.log('useAuth: Perfil carregado com sucesso:', data);
          if (isMounted) {
            setProfile(data);
            window.localStorage.setItem('mp_user_profile', JSON.stringify(data));
          }
        }
      } catch (err) {
        console.warn('useAuth: Erro inesperado ao obter perfil:', err);
        if (isMounted) {
          setProfile(null);
          window.localStorage.removeItem('mp_user_profile');
        }
      } finally {
        isFetching = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Listen for auth changes (this handles both INITIAL_SESSION and any subsequent auth events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth: Mudança de estado da autenticação detectada. Evento:', event);
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        window.localStorage.setItem('mp_auth_user', JSON.stringify(currentUser));
        await fetchProfileData(currentUser.id);
      } else {
        lastFetchedUserId = null;
        setProfile(null);
        setLoading(false);
        window.localStorage.removeItem('mp_auth_user');
        window.localStorage.removeItem('mp_user_profile');
      }
    });

    // Safety timeout fallback to prevent infinite loading screen
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading((currentLoading) => {
          if (currentLoading) {
            console.warn('useAuth: Timeout de segurança de 4.5s atingido. Destravando tela de carregamento.');
            return false;
          }
          return currentLoading;
        });
      }
    }, 4500);

    // Permitir que o listener onAuthStateChange lidere a busca inicial para sincronia perfeita e sem corrida
    if (!user) {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('mp_auth_user');
        window.localStorage.removeItem('mp_user_profile');
      }
      setUser(null);
      setProfile(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' && profile?.status !== 'blocked' && profile?.status !== 'suspended',
    isEditor: (profile?.role === 'editor' || profile?.role === 'admin') && profile?.status !== 'blocked' && profile?.status !== 'suspended',
    isBlocked: profile?.status === 'blocked',
    isSuspended: profile?.status === 'suspended',
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
