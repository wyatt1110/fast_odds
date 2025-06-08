import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  telegram_username: string | null;
  phone_number: string | null;
  country: string | null;
  membership_tier?: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasProAccess = () => {
    if (!userProfile?.membership_tier) return false;
    const tier = userProfile.membership_tier.toLowerCase();
    return tier !== 'basic';
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setUserProfile(data);
        }
      } catch (err) {
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return {
    userProfile,
    loading,
    error,
    hasProAccess: hasProAccess()
  };
}; 