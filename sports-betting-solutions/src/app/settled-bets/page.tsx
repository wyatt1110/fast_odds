'use client';

import React, { useEffect, useState } from 'react';
import SettledBetsPageContent from '@/frontend-ui/pages/settled-bets-page';
import DashboardLayout from '@/frontend-ui/layouts/DashboardLayout';
import { getCurrentUser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettledBetsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
    }
    
    checkAuth();
  }, [router]);
  
  return (
    <DashboardLayout>
      {userId ? <SettledBetsPageContent userId={userId} /> : null}
    </DashboardLayout>
  );
} 