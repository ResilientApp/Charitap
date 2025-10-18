import React, { useState } from 'react';
import RippleButton from '../RippleButton';

export default function VerifyEmail() {
  const [email, setEmail] = useState(() => {
    const pending = localStorage.getItem('charitap_pending_signup');
    try { return pending ? JSON.parse(pending).email : ''; } catch { return ''; }
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const SERVER = process.env.REACT_APP_SERVER_URL || 'http://localhost:4242';

  const sendEmail = async () => {
    setError('');
    if (!email) { setError('Missing email'); return; }
    setLoading(true);
    try {
      await fetch(`${SERVER}/api/password/request-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      setSent(true);
    } catch (e) {
      setError('Failed to send code. Check server config.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError('');
    if (!otp) { setError('Enter the code'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/password/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Invalid code');
      // signal success to next route via sessionStorage
      sessionStorage.setItem('charitap_email_verified', '1');
      window.location.href = '/complete-profile';
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-yellow-100 space-y-6 animate-fade-in">
        <div className="text-center">
          <img className="w-12 h-12 mx-auto" src="/logo.png" alt="Charitap" />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Verify your email</h1>
          <p className="text-gray-600">We sent a 6-digit code to your email</p>
        </div>

        {!sent && (
          <>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <RippleButton onClick={sendEmail} className="w-full bg-black text-white rounded-full px-5 py-2.5">{loading ? 'Sending...' : 'Send code'}</RippleButton>
          </>
        )}
        {sent && (
          <>
            <label className="block text-sm font-medium text-gray-700">Enter code</label>
            <input className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" value={otp} onChange={e=>setOtp(e.target.value)} />
            <RippleButton onClick={verify} className="w-full bg-black text-white rounded-full px-5 py-2.5">{loading ? 'Verifying...' : 'Verify'}</RippleButton>
          </>
        )}
        {error && (<div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>)}
      </div>
    </div>
  );
}


