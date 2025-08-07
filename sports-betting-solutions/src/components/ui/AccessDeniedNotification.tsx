'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedNotificationProps {
  message?: string;
  showUpgradeLink?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function AccessDeniedNotification({
  message = 'You do not have access to this page',
  showUpgradeLink = true,
  autoHide = true,
  autoHideDelay = 5000
}: AccessDeniedNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-500/90 text-white p-4 rounded-lg shadow-lg animate-slide-in-right">
      <div className="flex items-start">
        <div className="flex-1 mr-2">
          <p className="text-sm font-medium">{message}</p>
          {showUpgradeLink && (
            <Link 
              href="/membership" 
              className="text-xs mt-1 inline-block text-white underline hover:text-gray-200"
            >
              Upgrade your membership
            </Link>
          )}
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Helper function to show the notification programmatically
export function showAccessDeniedNotification(
  message?: string,
  showUpgradeLink?: boolean
) {
  // Create a div for the notification
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'access-denied-notification-container';
  document.body.appendChild(notificationContainer);

  // Render the notification (would need to use ReactDOM.render in a real implementation)
  // This is just a placeholder for the concept
  notificationContainer.innerHTML = `
    <div class="fixed bottom-4 right-4 z-50 max-w-sm bg-red-500/90 text-white p-4 rounded-lg shadow-lg">
      <div class="flex items-start">
        <div class="flex-1 mr-2">
          <p class="text-sm font-medium">${message || 'You do not have access to this page'}</p>
          ${showUpgradeLink ? '<a href="/membership" class="text-xs mt-1 inline-block text-white underline hover:text-gray-200">Upgrade your membership</a>' : ''}
        </div>
        <button 
          onclick="document.getElementById('access-denied-notification-container').remove()"
          class="text-white hover:text-gray-200"
          aria-label="Close notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `;

  // Auto-remove after 5 seconds
  setTimeout(() => {
    const container = document.getElementById('access-denied-notification-container');
    if (container) {
      container.remove();
    }
  }, 5000);
}
