'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function RegistrationConfirm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/login');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registration Successful
        </h2>
        
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            {email ? (
              <>
                We have sent a confirmation email to <strong>{email}</strong>. 
                Please check your inbox and click the verification link to complete your registration.
              </>
            ) : (
              <>
                We have sent a confirmation email to your email address.
                Please check your inbox and click the verification link to complete your registration.
              </>
            )}
          </p>
        </div>
        
        <div className="mt-6">
          <p className="text-gray-600 mb-4">
            You will be redirected to the login page in {countdown} seconds, or you can 
            <Link href="/login" className="text-blue-600 hover:text-blue-500 ml-1">
              click here to log in now
            </Link>
          </p>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder or 
              <Link href="/contact" className="text-blue-600 hover:text-blue-500 ml-1">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 