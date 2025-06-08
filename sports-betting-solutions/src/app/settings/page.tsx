'use client';

import React from 'react';
import SettingsPage from '@/frontend-ui/pages/settings-page';
import DashboardLayout from '@/frontend-ui/layouts/DashboardLayout';

export default function SettingsPageRoute() {
  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  );
} 