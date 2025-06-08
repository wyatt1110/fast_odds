import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface SessionData {
  user: User | null;
  session: Session | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      setLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (mounted) {
        if (error) {
          console.error('Error fetching session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    }

    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    data: {
      session,
      user
    },
    loading,
    isAuthenticated: !!user
  };
} 