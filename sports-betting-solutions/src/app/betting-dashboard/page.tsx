'use client';

import React from 'react';
import BettingDashboardPage from '../../frontend-ui/pages/betting-dashboard-page';
import DashboardLayout from '../../frontend-ui/layouts/DashboardLayout';

export default function BettingDashboard() {
  return (
    <DashboardLayout>
      <BettingDashboardPage />
    </DashboardLayout>
  );
} 