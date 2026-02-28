import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '../../auth/google';
import RippleButton from '../RippleButton';

export default function SignUp() {
  const { signupWithEmail, loginWithGoogle, isLoading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Password strength validation with visual feedback
  const getPasswordStrength = (pwd) => {
    const minLen = pwd.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(pwd);
    
    const checks = { minLen, hasLetter, hasNumber, hasSymbol };
    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    let strength = 'weak';
    let color = 'red';
    if (passedChecks === 4) {
      strength = 'strong';
      color = 'green';
    } else if (passedChecks >= 3) {
      strength = 'medium';
      color = 'yellow';
    }
    
    return { checks, strength, color, passedChecks, totalChecks: 4 };
  };

  const passwordStrength = getPasswordStrength(password);
  const allRequirementsMet = passwordStrength.passedChecks === 4;

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if all password requirements are met
    if (!allRequirementsMet) {
      setError('🔒 Please meet all password requirements before signing up.');
      return;
    }

    if (password !== confirm) {
      setError('❌ Passwords do not match. Please make sure both passwords are identical.');
      return;
    }

    // Validate email format with proper @ and .com validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('✉️ Please enter a valid email address (e.g., user@example.com).');
      return;
    }

    try {
      await signupWithEmail(email, password);
      nav('/complete-profile');
    } catch (err) {
      // Provide user-friendly error messages
      const errorMsg = err.message || 'Failed to sign up';
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        setError('📧 An account with this email already exists. Redirecting to sign in...');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => nav('/signin'), 2000);
      } else if (errorMsg.includes('invalid email')) {
        setError('✉️ Please enter a valid email address (e.g., user@example.com).');
      } else if (errorMsg.includes('password')) {
        setError('🔒 Password must meet the requirements. Please try a different password.');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        setError('🌐 Network error. Please check your internet connection and try again.');
      } else {
        console.error('Signup internal error:', errorMsg);
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        await loginWithGoogle(tokenResponse.access_token);
        window.location.href = '/';
      } catch (e) {
        setError(`🔐 ${e.message || 'Google sign-up failed'}`);
        setLoading(false);
      }
    },
    onError: () => {
      setError('⚠️ Google sign-up failed.');
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-yellow-100 space-y-6 animate-fade-in my-8">
        <div className="text-center mb-6">
          <img className="w-12 h-12 mx-auto" src="/logo.png" alt="Charitap" />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Create your Charitap account</h1>
          <p className="text-gray-600">It takes less than a minute to start giving with every click.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleEmailSignup}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <button type="button" aria-label="Toggle password visibility" className="absolute right-3 top-3.5 text-sm text-gray-500" onClick={() => setShowPw(v => !v)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password strength:</span>
                  <span className={`text-xs font-semibold ${
                    passwordStrength.color === 'green' ? 'text-green-600' :
                    passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {passwordStrength.strength.toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      passwordStrength.color === 'green' ? 'bg-green-500' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(passwordStrength.passedChecks / passwordStrength.totalChecks) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Password Requirements Checklist */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordStrength.checks.minLen ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.minLen ? '✓' : '○'}
                  </span>
                  <span className={passwordStrength.checks.minLen ? 'text-green-600' : 'text-gray-600'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordStrength.checks.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.hasLetter ? '✓' : '○'}
                  </span>
                  <span className={passwordStrength.checks.hasLetter ? 'text-green-600' : 'text-gray-600'}>
                    At least one letter
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordStrength.checks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.hasNumber ? '✓' : '○'}
                  </span>
                  <span className={passwordStrength.checks.hasNumber ? 'text-green-600' : 'text-gray-600'}>
                    At least one number
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`mr-2 ${passwordStrength.checks.hasSymbol ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordStrength.checks.hasSymbol ? '✓' : '○'}
                  </span>
                  <span className={passwordStrength.checks.hasSymbol ? 'text-green-600' : 'text-gray-600'}>
                    At least one symbol (!@#$%^&*...)
                  </span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <button type="button" aria-label="Toggle confirm visibility" className="absolute right-3 top-3.5 text-sm text-gray-500" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <RippleButton 
            type="submit" 
            disabled={!allRequirementsMet || password !== confirm || isLoading}
            className={`w-full px-5 py-2.5 rounded-full font-semibold transition-colors ${
              allRequirementsMet && password === confirm && !isLoading
                ? 'bg-black text-white hover:bg-yellow-300 hover:text-black'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </RippleButton>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">or sign up with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-4 w-full">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 font-medium">Signing you up...</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => !(isLoading || loading) && googleLogin()}
              disabled={isLoading || loading}
              aria-disabled={isLoading || loading}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-full transition-all duration-200 group ${
                (isLoading || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-semibold">Sign up with Google</span>
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-yellow-600 hover:text-yellow-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}


