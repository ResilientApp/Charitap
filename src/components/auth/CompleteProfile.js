import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import RippleButton from '../RippleButton';

export default function CompleteProfile() {
  const { user, profile, saveName, authProvider } = useAuth();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const nav = useNavigate();

  const isGoogle = authProvider === 'google';

  useEffect(() => {
    if (isGoogle) {
      // If from Google, names should already be present; route to settings
      nav('/settings', { replace: true });
    }
  }, [isGoogle, nav]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-yellow-100">
        <div className="text-center mb-6">
          <img className="w-12 h-12 mx-auto" src="/logo.png" alt="Charitap" />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Complete your profile</h1>
          <p className="text-gray-600">Add your name to continue</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <RippleButton
            onClick={async () => {
              if (!first.trim() || !last.trim()) return;
              await saveName(first.trim(), last.trim());
              nav('/settings', { replace: true });
            }}
            className={`w-full bg-black text-white hover:bg-yellow-300 hover:text-black px-5 py-2.5 rounded-full text-sm font-semibold ${!first.trim() || !last.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Save and Continue
          </RippleButton>
        </div>
      </div>
    </div>
  );
}


