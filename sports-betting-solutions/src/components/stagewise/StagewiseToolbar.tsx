'use client';

import { useEffect, useState } from 'react';

const stagewiseConfig = {
  plugins: []
};

export default function StagewiseToolbar() {
  const [isClient, setIsClient] = useState(false);
  const [StagewiseComponent, setStagewiseComponent] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Only load in development mode and on client side
    if (process.env.NODE_ENV === 'development') {
      import('@stagewise/toolbar-react').then((module) => {
        setStagewiseComponent(() => module.StagewiseToolbar);
      }).catch(() => {
        // Silently fail if stagewise is not available
      });
    }
  }, []);

  // Only render in development mode and on client side
  if (!isClient || process.env.NODE_ENV !== 'development' || !StagewiseComponent) {
    return null;
  }

  return <StagewiseComponent config={stagewiseConfig} />;
} 