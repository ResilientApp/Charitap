import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '../../auth/google';
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

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await signupWithEmail(email, password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };

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
            <p className="text-xs text-gray-500 mt-1">Choose any password you prefer.</p>
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
          <RippleButton type="submit" className="w-full bg-black text-white hover:bg-yellow-300 hover:text-black px-5 py-2.5 rounded-full font-semibold transition-colors">
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </RippleButton>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">or sign up with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="w-full">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              console.log('Google OAuth Success:', credentialResponse);
              try {
                const result = await loginWithGoogle(credentialResponse.credential);
                console.log('Login result:', result);
                nav('/', { replace: true });
              } catch (e) {
                console.error('Google OAuth Error:', e);
                setError(e.message);
              }
            }}
            onError={() => {
              setError('Google sign-in failed. Please try again.');
            }}
            useOneTap={false}
            theme="outline"
            size="large"
            text="signup_with"
            shape="pill"
            width="100%"
          />
        </div>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-yellow-600 hover:text-yellow-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}


