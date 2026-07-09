import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, ThemeName } from '../types';
import { useTheme } from './ThemeContext';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ session: null, user: null, profile: null, loading: true, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) { console.error('[auth] fetchProfile error:', error.message); return; }
    const p = data as Profile | null;
    setProfile(p);
    if (p?.theme) setTheme(p.theme as ThemeName);
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) fetchProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) fetchProfile(newSession.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [setTheme]);

  return <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
