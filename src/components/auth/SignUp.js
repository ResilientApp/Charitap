import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import RippleButton from '../RippleButton';

export default function SignUp() {
  const { beginSignupWithEmail, loginWithGoogle, isLoading } = useAuth();
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
      await beginSignupWithEmail(email, password);
      window.location.href = '/verify-email';
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-yellow-100 space-y-6 animate-fade-in">
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
            <p className="text-xs text-gray-500 mt-1">Use at least 8 characters with letters & numbers.</p>
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

        <button
          onClick={async () => {
            try {
              await loginWithGoogle();
              nav('/', { replace: true });
            } catch (e) {
              setError(e.message);
            }
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-gray-800 font-medium">Sign up with Google</span>
        </button>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-yellow-600 hover:text-yellow-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}


