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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isEditor: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, maybe it's still being created by the trigger
          console.warn('Profile not found for user:', userId);
        } else {
          throw error;
        }
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
    isAdmin: profile?.role === 'admin',
    isEditor: profile?.role === 'editor' || profile?.role === 'admin',
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
