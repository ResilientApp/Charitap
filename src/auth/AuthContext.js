// src/auth/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithGoogleGSI } from './google';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, displayName }
  const [profile, setProfile] = useState(null); // {firstName, lastName, email}
  const [authProvider, setAuthProvider] = useState(null); // 'google' | 'local' | null
  const [loading, setLoading] = useState(true);
  // Avoid router dependency here; pages decide navigation

  useEffect(() => {
    // No Firebase subscription; bootstrap from localStorage (temporary until MongoDB backend is wired)
    const raw = localStorage.getItem('charitap_auth');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        // 5-day session persistence
        if (data.expiresAt && Date.now() > data.expiresAt) {
          localStorage.removeItem('charitap_auth');
        } else {
          setUser({ id: data.id, email: data.email, displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() });
          setProfile({ email: data.email, firstName: data.firstName || '', lastName: data.lastName || '' });
          setAuthProvider(data.provider || null);
        }
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  const value = useMemo(() => ({
    // state
    user,
    profile,
    isAuthenticated: Boolean(user),
    isLoading: loading,

    // derived fields
    email: user?.email || profile?.email || '',
    displayName: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : (user?.displayName || ''),

    // actions
    // TEMP local impls until MongoDB backend is ready
    loginWithGoogle: async () => {
      setLoading(true);
      try {
        const info = await signInWithGoogleGSI();
        const stored = { id: info.id, email: info.email, firstName: info.firstName, lastName: info.lastName, provider: 'google' };
        localStorage.setItem('charitap_auth', JSON.stringify(stored));
        setUser({ id: info.id, email: info.email, displayName: `${info.firstName || ''} ${info.lastName || ''}`.trim() });
        setProfile({ email: info.email, firstName: info.firstName || '', lastName: info.lastName || '' });
        setAuthProvider('google');
        return stored;
      } finally {
        setLoading(false);
      }
    },
    loginWithEmail: async (email, password) => {
      // Simulate login (replace with your MongoDB API call)
      const stored = JSON.parse(localStorage.getItem('charitap_users') || '{}');
      const userRec = stored[email];
      if (!userRec || userRec.password !== password) {
        throw new Error('Invalid credentials');
      }
      const session = { id: userRec.id, email, firstName: userRec.firstName || '', lastName: userRec.lastName || '', provider: 'local', expiresAt: Date.now() + 5*24*60*60*1000 };
      localStorage.setItem('charitap_auth', JSON.stringify(session));
      setUser({ id: session.id, email, displayName: `${session.firstName} ${session.lastName}`.trim() });
      setProfile({ email, firstName: session.firstName, lastName: session.lastName });
      setAuthProvider('local');
      return session;
    },
    signupWithEmail: async (email, password) => {
      // Simulate signup (replace with your MongoDB API call)
      const users = JSON.parse(localStorage.getItem('charitap_users') || '{}');
      if (users[email]) throw new Error('Email already registered');
      const id = `local_${Math.random().toString(36).slice(2)}`;
      users[email] = { id, email, password, firstName: '', lastName: '' };
      localStorage.setItem('charitap_users', JSON.stringify(users));
      const session = { id, email, firstName: '', lastName: '', provider: 'local', expiresAt: Date.now() + 5*24*60*60*1000 };
      localStorage.setItem('charitap_auth', JSON.stringify(session));
      setUser({ id, email, displayName: '' });
      setProfile({ email, firstName: '', lastName: '' });
      setAuthProvider('local');
      return session;
    },
    logout: async () => {
      localStorage.removeItem('charitap_auth');
      setUser(null);
      setProfile(null);
      setAuthProvider(null);
    },
    saveName: async (firstName, lastName) => {
      const sessionRaw = localStorage.getItem('charitap_auth');
      if (!sessionRaw) return;
      const session = JSON.parse(sessionRaw);
      // Update session
      const newSession = { ...session, firstName, lastName };
      localStorage.setItem('charitap_auth', JSON.stringify(newSession));
      // Update users map
      const users = JSON.parse(localStorage.getItem('charitap_users') || '{}');
      if (users[session.email]) {
        users[session.email].firstName = firstName;
        users[session.email].lastName = lastName;
        localStorage.setItem('charitap_users', JSON.stringify(users));
      }
      setProfile({ email: session.email, firstName, lastName });
      setUser({ id: session.id, email: session.email, displayName: `${firstName} ${lastName}`.trim() });
    },
    changePassword: async (currentPassword, newPassword) => {
      const sessionRaw = localStorage.getItem('charitap_auth');
      if (!sessionRaw) throw new Error('Not authenticated');
      const session = JSON.parse(sessionRaw);
      const users = JSON.parse(localStorage.getItem('charitap_users') || '{}');
      const record = users[session.email];
      if (!record || record.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      users[session.email].password = newPassword;
      localStorage.setItem('charitap_users', JSON.stringify(users));
    },
    authProvider
  }), [user, profile, loading, authProvider]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


