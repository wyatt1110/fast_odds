'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we have an access token in the URL (auth flow)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session and no hash in URL, redirect to login
      if (!session && !window.location.hash) {
        router.push('/login');
      }
    };
    
    checkSession();
  }, [router]);

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength('weak');
      return false;
    }
    
    // Check for complexity (at least one number, one uppercase, one lowercase, one special character)
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (hasNumber && hasUpperCase && hasLowerCase && hasSpecialChar) {
      setPasswordStrength('strong');
      return true;
    } else if ((hasNumber && hasUpperCase) || (hasUpperCase && hasSpecialChar) || (hasLowerCase && hasNumber)) {
      setPasswordStrength('medium');
      return password.length >= 10; // Medium passwords should be longer
    } else {
      setPasswordStrength('weak');
      return false;
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    // Validate password strength
    if (!checkPasswordStrength(password)) {
      setError('Password is too weak. Please use a combination of uppercase, lowercase, numbers, and special characters.');
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setMessage('Password has been successfully updated. Redirecting to login...');
      setPassword('');
      setConfirmPassword('');
      setPasswordStrength(null);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    if (!password) return null;
    
    return (
      <div className="mt-2">
        <div className="text-sm mb-1">Password strength: {passwordStrength}</div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              passwordStrength === 'weak' ? 'w-1/3 bg-red-500' : 
              passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' : 
              'w-full bg-green-500'
            }`}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) checkPasswordStrength(e.target.value);
                }}
              />
              <PasswordStrengthIndicator />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters.
              </p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-1"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}
          
          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm font-medium text-green-800">{message}</div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : null}
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 