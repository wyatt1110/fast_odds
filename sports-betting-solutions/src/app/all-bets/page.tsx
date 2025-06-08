'use client';

import React from 'react';
import AllBetsPageContent from '@/frontend-ui/pages/all-bets-page';
import DashboardLayout from '@/frontend-ui/layouts/DashboardLayout';

export default function AllBetsPage() {
  return (
    <DashboardLayout>
      <AllBetsPageContent />
    </DashboardLayout>
  );
} 