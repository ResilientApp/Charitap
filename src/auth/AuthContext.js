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

  // Function to update user state from API response
  const updateUserState = (userData, token) => {
    if (userData) {
      const { id, email, displayName, firstName, lastName, profilePicture, authProvider, paymentPreference, selectedCharities } = userData;
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration
      const storedData = { id, email, displayName, firstName, lastName, profilePicture, authProvider, paymentPreference, selectedCharities, token, expiresAt };
      localStorage.setItem('charitap_auth', JSON.stringify(storedData));

      setUser({ id, email, displayName, firstName, lastName, profilePicture, authProvider, paymentPreference, selectedCharities });
      setProfile({ email, firstName, lastName });
      setAuthProvider(authProvider);
      setEmailVerified(true);
    } else {
      localStorage.removeItem('charitap_auth');
      setUser(null);
      setProfile(null);
      setAuthProvider(null);
      setEmailVerified(false);
    }
  };

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
    if (user && user.id && token) {
      const email = user.email;
      const userId = user.id;

      if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        window.chrome.runtime.sendMessage(
          process.env.REACT_APP_CHROME_EXTENSION_ID || "hmadgdapmiiiimdhebjchcocnjennahi",
          { 
            type: "SAVE_USER_DATA", 
            email: email, 
            userId: userId,
            token: token 
          },
          (response) => {
            if (window.chrome.runtime.lastError) {
              console.error(`Website: Error sending message to extension: ${window.chrome.runtime.lastError.message}`);
            } else if (response && response.status === "success") {
              console.log(`Website: User data successfully sent to extension`);
            }
          }
        );
        console.log("Stored Email:", email);
        console.log("Stored UserID:", userId);
        console.log("Stored Token:", token ? "Present" : "Missing");
      }

      
    }
  }, [user, token]);

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

      loginWithGoogle: async (googleCredential) => {
        setLoading(true);
        try {
          console.log('AuthContext: Starting Google login with credential:', googleCredential ? 'Present' : 'Missing');
          
          // Decode Google credential JWT
          let googleInfo;
          if (googleCredential) {
            // Direct credential from GoogleLogin component
            const { jwtDecode } = await import('jwt-decode');
            const decoded = jwtDecode(googleCredential);
            googleInfo = {
              id: decoded.sub,
              email: decoded.email,
              fullName: decoded.name || '',
              firstName: decoded.given_name || '',
              lastName: decoded.family_name || '',
              picture: decoded.picture || ''
            };
            console.log('AuthContext: Decoded Google info:', googleInfo);
          } else {
            // Fallback to custom popup flow
            googleInfo = await signInWithGoogleGSI();
          }
          
          console.log('AuthContext: Calling backend with:', {
            googleId: googleInfo.id,
            email: googleInfo.email,
            displayName: googleInfo.fullName,
            profilePicture: googleInfo.picture
          });
          
          // Send to backend
          const response = await authAPI.googleAuth(
            googleInfo.id,
            googleInfo.email,
            googleInfo.fullName || googleInfo.email.split('@')[0],
            googleInfo.picture,
            googleInfo.firstName,
            googleInfo.lastName
          );
          
          console.log('AuthContext: Backend response:', response);
          
          const session = saveAuthData(response);
          
          setUser({ 
            id: response.user.id, 
            email: response.user.email, 
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            displayName: response.user.displayName,
            profilePicture: response.user.profilePicture,
            authProvider: response.user.authProvider,
            paymentPreference: response.user.paymentPreference,
            selectedCharities: response.user.selectedCharities
          });
          setProfile({ 
            email: response.user.email, 
            firstName: response.user.firstName || '', 
            lastName: response.user.lastName || '' 
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
        setLoading(true);
        try {
          const response = await authAPI.updateProfile({ firstName, lastName });
          if (response.user) {
            // Update local state with new profile info
            const currentAuth = JSON.parse(localStorage.getItem('charitap_auth') || '{}');
            const updatedAuth = {
              ...currentAuth,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              displayName: response.user.displayName || `${firstName} ${lastName}`.trim()
            };
            localStorage.setItem('charitap_auth', JSON.stringify(updatedAuth));
            // Update user state manually since updateUserState is not in scope here
            setUser({ 
              id: response.user.id, 
              email: response.user.email, 
              displayName: response.user.displayName,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              profilePicture: response.user.profilePicture,
              authProvider: response.user.authProvider,
              paymentPreference: response.user.paymentPreference,
              selectedCharities: response.user.selectedCharities
            });
            setProfile({ 
              email: response.user.email, 
              firstName: response.user.firstName, 
              lastName: response.user.lastName 
            });
            return response.user;
          } else {
            throw new Error(response.error || 'Failed to save name');
          }
        } catch (error) {
          // If token is invalid, clear it and redirect to login
          if (error.message && (error.message.includes('Invalid token') || error.message.includes('Token expired'))) {
            localStorage.removeItem('charitap_auth');
            setUser(null);
            setProfile(null);
            setAuthProvider(null);
            setToken(null);
            setEmailVerified(false);
            window.location.href = '/signin';
            return;
          }
          throw new Error(error.message || 'Failed to update profile');
        } finally {
          setLoading(false);
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

