/**
 * COMPONENT NAME
 * 
 * Purpose: [Brief description of what this component does]
 * 
 * Used by: [List of components or pages that use this component]
 * Example: Used by /src/frontend-ui/pages/betting-dashboard-page.tsx
 * 
 * Props:
 * - propName: Description of the prop
 * - anotherProp: Description of another prop
 * 
 * Dependencies:
 * - External libraries used by this component
 * - Any API services the component calls
 * 
 * State Management:
 * - Describe how the component manages state
 * - Any contexts used/provided
 * 
 * Notes:
 * - Any important notes about implementation details
 * - Known issues or limitations
 */

'use client';

import React, { useState } from 'react';

// Define the interface for component props
interface ComponentNameProps {
  propName: string;
  anotherProp?: number; // Optional prop
  onSomething?: () => void; // Optional event handler
}

export default function ComponentName({ 
  propName, 
  anotherProp = 0, // Default value for optional prop
  onSomething 
}: ComponentNameProps) {
  // Local state
  const [localState, setLocalState] = useState('');

  // Event handlers
  const handleLocalEvent = () => {
    setLocalState('New value');
    if (onSomething) {
      onSomething();
    }
  };

  // Render component
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold">{propName}</h2>
      
      {anotherProp > 0 && (
        <p className="text-gray-600">Another prop: {anotherProp}</p>
      )}
      
      <button 
        onClick={handleLocalEvent}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Click me
      </button>
      
      {localState && (
        <p className="mt-2 text-green-600">{localState}</p>
      )}
    </div>
  );
} 