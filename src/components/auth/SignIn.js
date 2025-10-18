import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { GoogleLogin } from '../../auth/google';
import RippleButton from '../RippleButton';

function ForgotPasswordModal({ open, onClose, presetEmail }) {
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [email, setEmail] = useState(presetEmail || '');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const requestOtp = async () => {
    setError('');
    const users = JSON.parse(localStorage.getItem('charitap_users') || '{}');
    const rec = users[email];
    if (!rec) {
      setError('No local account found for this email.');
      return;
    }
    setSending(true);
    try {
      await fetch((process.env.REACT_APP_SERVER_URL || 'http://localhost:4242') + '/api/password/request-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      setStep('verify');
    } catch (e) {
      setError('Failed to send OTP. Check server and email config.');
    } finally {
      setSending(false);
    }
  };

  const verifyAndReset = async () => {
    setError('');
    if (newPw !== confirmPw) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await fetch((process.env.REACT_APP_SERVER_URL || 'http://localhost:4242') + '/api/password/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Invalid code');
      const users = JSON.parse(localStorage.getItem('charitap_users') || '{}');
      users[email].password = newPw;
      localStorage.setItem('charitap_users', JSON.stringify(users));
      onClose();
      alert('Password reset successful. You can sign in now.');
    } catch (e) {
      setError(e.message || 'Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-scale-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{step === 'request' ? 'Reset your password' : 'Verify code and set new password'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>
        {step === 'request' && (
          <>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input className="w-full px-3 py-2 border rounded-lg" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <RippleButton onClick={requestOtp} className="w-full bg-black text-white rounded-full px-5 py-2.5">{sending ? 'Sending...' : 'Send OTP'}</RippleButton>
          </>
        )}
        {step === 'verify' && (
          <>
            <label className="block text-sm font-medium text-gray-700">Enter OTP sent to {email}</label>
            <input className="w-full px-3 py-2 border rounded-lg" value={otp} onChange={e=>setOtp(e.target.value)} />
            <label className="block text-sm font-medium text-gray-700 mt-2">New password</label>
            <input className="w-full px-3 py-2 border rounded-lg" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} />
            <label className="block text-sm font-medium text-gray-700 mt-2">Confirm password</label>
            <input className="w-full px-3 py-2 border rounded-lg" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <RippleButton onClick={verifyAndReset} className="w-full bg-black text-white rounded-full px-5 py-2.5">Reset Password</RippleButton>
          </>
        )}
      </div>
    </div>
  );
}
export default function SignIn() {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const nav = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithEmail(email, password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} presetEmail={email} />
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
            <div className="mt-1">
              <button type="button" className="text-xs text-gray-600 hover:text-gray-800 underline" onClick={()=>setShowForgot(true)}>Forgot password?</button>
            </div>
          </div>
          <RippleButton type="submit" className="w-full bg-black text-white hover:bg-yellow-300 hover:text-black px-5 py-2.5 rounded-full font-semibold transition-colors">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </RippleButton>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="w-full">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await loginWithGoogle(credentialResponse.credential);
                nav('/', { replace: true });
              } catch (e) {
                setError(e.message);
              }
            }}
            onError={() => {
              setError('Google sign-in failed. Please try again.');
            }}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            width="100%"
          />
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


