'use client';

import React from 'react';
import AnalyticsPage from '@/frontend-ui/pages/analytics-page';
import DashboardLayout from '@/frontend-ui/layouts/DashboardLayout';

export default function AnalyticsPageRoute() {
  return (
    <DashboardLayout>
      <AnalyticsPage />
    </DashboardLayout>
  );
} 