// src/auth/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithGoogleGSI } from './google';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children}) {
  const [user, setUser] = useState(null); // { id, email, displayName, profilePicture }
  const [profile, setProfile] = useState(null); // {firstName, lastName, email}
  const [authProvider, setAuthProvider] = useState(null); // 'google' | 'local' | null
  const [emailVerified, setEmailVerified] = useState(true); // Always true now
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('charitap_auth');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        // Check if token is expired (7 days)
        if (data.expiresAt && Date.now() > data.expiresAt) {
          localStorage.removeItem('charitap_auth');
          setLoading(false);
          return;
        }
        
        setToken(data.token);
        setUser({ 
          id: data.id, 
          email: data.email, 
          displayName: data.displayName,
          profilePicture: data.profilePicture 
        });
        setProfile({ 
          email: data.email, 
          firstName: data.firstName || '', 
          lastName: data.lastName || '' 
        });
        setAuthProvider(data.provider || null);
        setEmailVerified(true);
      } catch (error) {
        console.error('Error loading auth data:', error);
        localStorage.removeItem('charitap_auth');
      }
    }
    setLoading(false);
  }, []);

  // Chrome Extension Communication
  useEffect(() => {
    if (user && user.id) {
      const email = user.email;
      const userId = user.id;

      if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        window.chrome.runtime.sendMessage(
          process.env.REACT_APP_CHROME_EXTENSION_ID || "hmadgdapmiiiimdhebjchcocnjennahi",
          { type: "SAVE_USER_ID", userId: userId },
          (response) => {
            if (window.chrome.runtime.lastError) {
              console.error(`Website: Error sending message to extension: ${window.chrome.runtime.lastError.message}`);
            } else if (response && response.status === "success") {
              console.log(`Website: User ID successfully sent to extension`);
            }
          }
        );
      }

      console.log("Stored Email:", email);
      console.log("Stored UserID:", userId);
    }
  }, [user]);

  // Save auth data to localStorage
  const saveAuthData = (authData) => {
    const session = {
      id: authData.user.id,
      email: authData.user.email,
      displayName: authData.user.displayName,
      profilePicture: authData.user.profilePicture,
      firstName: authData.user.firstName || '',
      lastName: authData.user.lastName || '',
      provider: authData.user.authProvider,
      token: authData.token,
      verified: true,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    localStorage.setItem('charitap_auth', JSON.stringify(session));
    sessionStorage.removeItem('charitap_counts_done');
    return session;
  };

  const value = useMemo(() => {
    return {
      user: user,
      profile: profile,
      isAuthenticated: Boolean(user && token),
      isLoading: loading,
      token: token,

      // derived fields
      email: user?.email || profile?.email || '',
      displayName: user?.displayName || (profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : ''),
      emailVerified: emailVerified,

      // Backend-integrated authentication
      signupWithEmail: async (email, password) => {
        setLoading(true);
        try {
          const response = await authAPI.signup(email, password);
          const session = saveAuthData(response);
          
          setUser({ 
            id: response.user.id, 
            email: response.user.email, 
            displayName: response.user.displayName 
          });
          setProfile({ 
            email: response.user.email, 
            firstName: '', 
            lastName: '' 
          });
          setAuthProvider('local');
          setToken(response.token);
          setEmailVerified(true);
          
          return session;
        } catch (error) {
          throw new Error(error.message || 'Failed to sign up');
        } finally {
          setLoading(false);
        }
      },

      loginWithEmail: async (email, password) => {
        setLoading(true);
        try {
          const response = await authAPI.login(email, password);
          const session = saveAuthData(response);
          
          setUser({ 
            id: response.user.id, 
            email: response.user.email, 
            displayName: response.user.displayName,
            profilePicture: response.user.profilePicture 
          });
          setProfile({ 
            email: response.user.email, 
            firstName: response.user.firstName || '', 
            lastName: response.user.lastName || '' 
          });
          setAuthProvider('local');
          setToken(response.token);
          setEmailVerified(true);
          
          return session;
        } catch (error) {
          throw new Error(error.message || 'Failed to login');
        } finally {
          setLoading(false);
        }
      },

      loginWithGoogle: async () => {
        setLoading(true);
        try {
          // Get Google sign-in info
          const googleInfo = await signInWithGoogleGSI();
          
          // Send to backend
          const response = await authAPI.googleAuth(
            googleInfo.id,
            googleInfo.email,
            googleInfo.fullName || googleInfo.email.split('@')[0],
            googleInfo.picture
          );
          
          const session = saveAuthData(response);
          
          setUser({ 
            id: response.user.id, 
            email: response.user.email, 
            displayName: response.user.displayName,
            profilePicture: response.user.profilePicture 
          });
          setProfile({ 
            email: response.user.email, 
            firstName: googleInfo.firstName || '', 
            lastName: googleInfo.lastName || '' 
          });
          setAuthProvider('google');
          setToken(response.token);
          setEmailVerified(true);
          
          return session;
        } catch (error) {
          throw new Error(error.message || 'Failed to login with Google');
        } finally {
          setLoading(false);
        }
      },

      logout: async () => {
        localStorage.removeItem('charitap_auth');
        setUser(null);
        setProfile(null);
        setAuthProvider(null);
        setToken(null);
        setEmailVerified(false);
      },

      saveName: async (firstName, lastName) => {
        try {
          await authAPI.updateProfile(firstName, lastName);
          
          const sessionRaw = localStorage.getItem('charitap_auth');
          if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            const newSession = { ...session, firstName, lastName, displayName: `${firstName} ${lastName}`.trim() };
            localStorage.setItem('charitap_auth', JSON.stringify(newSession));
          }
          
          setProfile({ email: user?.email || '', firstName, lastName });
          setUser(prev => ({ ...prev, displayName: `${firstName} ${lastName}`.trim() }));
        } catch (error) {
          throw new Error(error.message || 'Failed to update profile');
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          await authAPI.changePassword(currentPassword, newPassword);
        } catch (error) {
          throw new Error(error.message || 'Failed to change password');
        }
      },

      deleteAccount: async () => {
        try {
          await authAPI.deleteAccount();
          localStorage.removeItem('charitap_auth');
          setUser(null);
          setProfile(null);
          setAuthProvider(null);
          setToken(null);
          setEmailVerified(false);
        } catch (error) {
          throw new Error(error.message || 'Failed to delete account');
        }
      },

      authProvider
    };
  }, [user, profile, loading, authProvider, emailVerified, token]);

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

