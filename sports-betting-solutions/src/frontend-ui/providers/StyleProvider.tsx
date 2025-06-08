'use client';

import React from 'react';

// Style Provider to ensure Tailwind and other styles are properly applied
export default function StyleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="style-provider h-full w-full">
      {children}
    </div>
  );
} 