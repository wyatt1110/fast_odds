'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function Login() {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Signup state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    
    checkSession();
  }, [router]);

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the country value directly from the form element to ensure it's captured
    const form = e.target as HTMLFormElement;
    const countrySelect = form.elements.namedItem('country') as HTMLSelectElement;
    const selectedCountry = countrySelect.value;
    
    setIsLoading(true);
    setSignupError(null);
    setSignupSuccess(null);
    
    // Debug log
    console.log('Form values:', {
      fullName,
      signupEmail,
      telegramUsername,
      phoneNumber,
      country,
      directCountryValue: selectedCountry,
      passwordStrength
    });
    
    // Validate passwords match
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    // Validate password strength
    if (!checkPasswordStrength(signupPassword)) {
      setSignupError('Password is too weak. Please use a combination of uppercase, lowercase, numbers, and special characters.');
      setIsLoading(false);
      return;
    }
    
    // Validate country selection - use both the state and direct form value
    if (!selectedCountry) {
      setSignupError('Please select your country of residence');
      setIsLoading(false);
      return;
    }
    
    // Use the directly captured country value
    const finalCountry = selectedCountry;
    
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            telegram_username: telegramUsername || null,
            phone_number: phoneNumber || null,
            country: finalCountry
          }
        },
      });
      
      if (authError) throw authError;
      
      if (authData?.user) {
        console.log('Creating user profile with country:', finalCountry);
        
        // Store additional user data in user_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            full_name: fullName,
            email: signupEmail,
            telegram_username: telegramUsername || null,
            phone_number: phoneNumber || null,
            country: finalCountry
          })
          .select();
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          throw new Error('Failed to create user profile. Please try again.');
        }
        
        console.log('User profile created:', profileData);
        
        // Create a default bankroll for the user
        try {
          const { data: bankrollData, error: bankrollError } = await supabase
            .from('bankrolls')
            .insert({
              user_id: authData.user.id,
              name: 'Default Bankroll',
              description: 'Your default bankroll for tracking bets',
              initial_amount: 1000,
              current_amount: 1000,
              currency: 'GBP',
              is_active: true
            })
            .select();
            
          if (bankrollError) {
            console.error('Error creating default bankroll:', bankrollError);
            // Don't throw here, just log the error - we still want to complete signup
          } else {
            console.log('Default bankroll created:', bankrollData);
            
            // Create default user settings
            const { error: settingsError } = await supabase
              .from('user_settings')
              .insert({
                user_id: authData.user.id,
                default_stake: 10,
                default_bankroll_id: bankrollData?.[0]?.id,
                stake_currency: 'GBP',
                preferred_odds_format: 'decimal',
                ai_preferences: { model: 'default' }
              });
              
            if (settingsError) {
              console.error('Error creating user settings:', settingsError);
              // Don't throw here, just log the error
            }
          }
        } catch (err) {
          console.error('Error in bankroll/settings creation:', err);
          // Don't throw here, we still want to complete signup
        }
        
        // Show success message
        setSignupSuccess('Account created! Please check your email for the confirmation link.');
        
        // Clear form
        setFullName('');
        setSignupEmail('');
        setTelegramUsername('');
        setPhoneNumber('');
        setSignupPassword('');
        setConfirmPassword('');
        setCountry('');
        setPasswordStrength(null);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    if (!signupPassword) return null;
    
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

  // List of countries for dropdown
  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
    "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", 
    "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", 
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", 
    "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", 
    "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", 
    "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", 
    "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", 
    "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", 
    "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
    "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", 
    "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", 
    "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", 
    "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Login Section (Left Side) */}
      <div className="w-1/2 px-8 py-12 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm font-medium text-red-800">{error}</div>
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
                Sign in
              </button>
            </div>
            
            <div className="text-sm text-center mt-3">
              <a href="#" onClick={() => router.push('/forgot-password')} className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-r border-gray-300"></div>
      
      {/* Sign Up Section (Right Side) */}
      <div className="w-1/2 px-8 py-12 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Sign Up
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Create a new account
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              
              {/* Email Address */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email Address"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
              
              {/* Telegram Username */}
              <div>
                <label htmlFor="telegram-username" className="block text-sm font-medium text-gray-700">
                  Telegram Username (Optional)
                </label>
                <input
                  id="telegram-username"
                  name="telegramUsername"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="@username"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                />
              </div>
              
              {/* Phone Number */}
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone-number"
                  name="phoneNumber"
                  type="tel"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              
              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(e.target.value);
                    if (e.target.value) checkPasswordStrength(e.target.value);
                  }}
                />
                <PasswordStrengthIndicator />
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters.
                </p>
              </div>
              
              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Re-type Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              {/* Country Dropdown */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country of Residence <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  value={country}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    console.log('Country selected:', selectedValue);
                    setCountry(selectedValue);
                    
                    // Validate immediately
                    if (!selectedValue) {
                      e.target.setCustomValidity('Please select your country of residence');
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                  onInvalid={(e) => {
                    const target = e.target as HTMLSelectElement;
                    target.setCustomValidity('Please select your country of residence');
                  }}
                  onBlur={(e) => {
                    const target = e.target as HTMLSelectElement;
                    if (!target.value) {
                      target.setCustomValidity('Please select your country of residence');
                    } else {
                      target.setCustomValidity('');
                    }
                  }}
                >
                  <option value="">Select a country</option>
                  {countries.map((countryName) => (
                    <option key={countryName} value={countryName}>
                      {countryName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-red-500">This field is required</p>
              </div>
            </div>
            
            {signupError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm font-medium text-red-800">{signupError}</div>
              </div>
            )}
            
            {signupSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm font-medium text-green-800">{signupSuccess}</div>
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
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 