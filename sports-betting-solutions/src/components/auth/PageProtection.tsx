'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { MembershipTier, getTierValue } from '@/lib/permissions/access-control';
import AccessDeniedNotification from '@/components/ui/AccessDeniedNotification';

interface PageProtectionProps {
  children: ReactNode;
  requiredAuth?: boolean;
  minimumTier?: MembershipTier;
  redirectTo?: string;
  showNotification?: boolean;
  notificationMessage?: string;
}

export default function PageProtection({
  children,
  requiredAuth = false,
  minimumTier,
  redirectTo,
  showNotification = true,
  notificationMessage
}: PageProtectionProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        // Check authentication if required
        if (requiredAuth) {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            if (redirectTo) {
              router.push(redirectTo);
              return;
            }
            setIsAuthorized(false);
            setShowAccessDenied(showNotification);
            setIsLoading(false);
            return;
          }
        }

        // If minimum tier is specified, check membership tier
        if (minimumTier !== undefined) {
          const { data } = await supabase.auth.getSession();
          
          if (!data.session) {
            if (redirectTo) {
              router.push(redirectTo);
              return;
            }
            setIsAuthorized(false);
            setShowAccessDenied(showNotification);
            setIsLoading(false);
            return;
          }

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('membership_tier')
            .eq('user_id', data.session.user.id)
            .single();

          // Get user's tier value
          const userTierValue = getTierValue(profile?.membership_tier);
          
          // User is authorized if their tier is >= required tier (no expiration check)
          const hasRequiredTier = userTierValue >= minimumTier;
          
          if (!hasRequiredTier) {
            if (redirectTo) {
              router.push(redirectTo);
              return;
            }
            setIsAuthorized(false);
            setShowAccessDenied(showNotification);
            setIsLoading(false);
            return;
          }
        }

        // If we got here, user is authorized
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking access:', error);
        setIsAuthorized(false);
        setIsLoading(false);
        setShowAccessDenied(showNotification);
      }
    }

    checkAccess();
  }, [requiredAuth, minimumTier, redirectTo, router, showNotification]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-betting-green"></div>
      </div>
    );
  }

  return (
    <>
      {isAuthorized ? children : null}
      {showAccessDenied && (
        <AccessDeniedNotification 
          message={notificationMessage || 'You do not have access to this page'} 
          showUpgradeLink={true}
        />
      )}
    </>
  );
}
