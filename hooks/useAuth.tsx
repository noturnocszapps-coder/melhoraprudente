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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let lastFetchedUserId: string | null = null;

    const fetchProfileData = async (userId: string) => {
      if (lastFetchedUserId === userId) return;
      lastFetchedUserId = userId;

      if (isMounted) {
        setLoading(true);
      }

      try {
        console.log('useAuth: Iniciando busca do perfil para o ID:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('useAuth: Erro técnico ao buscar perfil do banco de dados:', error);
          if (isMounted) {
            setProfile(null);
          }
        } else {
          console.log('useAuth: Perfil carregado com sucesso:', data);
          if (isMounted) {
            setProfile(data);
          }
        }
      } catch (err) {
        console.error('useAuth: Erro inesperado ao obter perfil:', err);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfileData(currentUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('useAuth: Erro na inicialização da autenticação:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth: Mudança de estado da autenticação detectada. Evento:', event);
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfileData(currentUser.id);
      } else {
        lastFetchedUserId = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
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
