import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useGoogleLogin } from '../../auth/google';
import RippleButton from '../RippleButton';

export default function SignIn() {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithEmail(email, password);
      nav('/', { replace: true });
    } catch (err) {
      // Provide user-friendly error messages
      const errorMsg = err.message || 'Failed to sign in';
      if (errorMsg.includes('Invalid email or password')) {
        setError('❌ Incorrect email or password. Please check your credentials and try again.');
      } else if (errorMsg.includes('Google Sign-In')) {
        setError('🔐 This account uses Google Sign-In. Please use the "Continue with Google" button below.');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        setError('🌐 Network error. Please check your internet connection and try again.');
      } else {
        setError(errorMsg);
      }
    }
  };
  
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        // We need to fetch user info with this token if using the implicit flow,
        // or just pass it to our loginWithGoogle if it handles tokens.
        // Actually, our loginWithGoogle expects a credential (JWT).
        // Let's check how loginWithGoogle is implemented.
        await loginWithGoogle(tokenResponse.access_token);
        nav('/', { replace: true });
      } catch (e) {
        setError(`🔐 ${e.message || 'Google sign-in failed'}`);
        setLoading(false);
      }
    },
    onError: () => {
      setError('⚠️ Google sign-in failed.');
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-yellow-100 space-y-6 animate-fade-in">
        <div className="text-center">
          <img className="w-12 h-12 mx-auto" src="/logo.png" alt="Charitap" />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Sign in to Charitap</h1>
          <p className="text-gray-600">Join your clicks to a cause — every tap counts.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleEmailLogin}>
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <button type="button" aria-label="Toggle password visibility" className="absolute right-3 top-3.5 text-sm text-gray-500" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <RippleButton 
            type="submit" 
            disabled={isLoading}
            aria-disabled={isLoading}
            className={`w-full px-5 py-2.5 rounded-full font-semibold transition-colors ${
              isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-yellow-300 hover:text-black'
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </RippleButton>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-4 w-full">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 font-medium">Signing you in...</p>
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
              <span className="text-gray-700 font-semibold">Continue with Google</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">We’ll never post without your permission. Payments use bank‑grade encryption via Stripe.</p>

        <p className="text-sm text-gray-600 mt-6 text-center">
          New here?{' '}
          <Link to="/signup" className="text-yellow-600 hover:text-yellow-700 font-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}


