// src/auth/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  auth,
  signInWithGoogleAndSyncProfile,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  subscribeToAuthChanges,
  getUserProfile,
  updateProfileName,
  changePassword
} from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user
  const [profile, setProfile] = useState(null); // Firestore profile {firstName, lastName, email}
  const [loading, setLoading] = useState(true);
  // Avoid router dependency here; pages decide navigation

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        const p = await getUserProfile(firebaseUser.uid);
        setUser(firebaseUser);
        setProfile(p || null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
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
    loginWithGoogle: async () => {
      setLoading(true);
      try {
        await signInWithGoogleAndSyncProfile();
        const p = await getUserProfile(auth.currentUser.uid);
        setProfile(p);
        return p;
      } finally {
        setLoading(false);
      }
    },
    loginWithEmail: async (email, password) => {
      setLoading(true);
      try {
        const u = await signInWithEmail(email, password);
        const p = await getUserProfile(u.uid);
        setProfile(p);
        return p;
      } finally {
        setLoading(false);
      }
    },
    signupWithEmail: async (email, password) => {
      setLoading(true);
      try {
        const u = await signUpWithEmail(email, password);
        const p = await getUserProfile(u.uid);
        setProfile(p);
        return p;
      } finally {
        setLoading(false);
      }
    },
    logout: async () => {
      await signOutUser();
    },
    saveName: async (firstName, lastName) => {
      if (!auth.currentUser) return;
      await updateProfileName(auth.currentUser.uid, firstName, lastName);
      const p = await getUserProfile(auth.currentUser.uid);
      setProfile(p);
    },
    changePassword: async (currentPassword, newPassword) => {
      await changePassword(currentPassword, newPassword);
    }
  }), [user, profile, loading]);

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


