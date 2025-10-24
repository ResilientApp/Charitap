import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import Breadcrumb from './Breadcrumb';
import CollapsibleSection from './CollapsibleSection';
import RippleButton from './RippleButton';
import {loadStripe} from '@stripe/stripe-js';
import {Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements} from '@stripe/react-stripe-js';
import { settingsAPI } from '../services/api';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function Settings() {
  const { user, profile, email, saveName, changePassword, logout, authProvider, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState(() => {
    const saved = localStorage.getItem('userDisplayName');
    const initial = saved || (profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : (user?.displayName || 'User'));
    return initial || 'User';
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  // Initialize from user/profile data, not from localStorage-derived displayName
  const [firstNameEdit, setFirstNameEdit] = useState('');
  const [lastNameEdit, setLastNameEdit] = useState('');
  const [charities, setCharities] = useState([]);

  // Payment preferences state
  const [paymentMode, setPaymentMode] = useState('monthly'); // 'monthly' or 'threshold'

  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('charitap_onboarding_show') === '1');

  // Update name fields when user data changes
  useEffect(() => {
    if (user?.firstName || profile?.firstName) {
      setFirstNameEdit(user?.firstName || profile?.firstName || '');
    }
    if (user?.lastName || profile?.lastName) {
      setLastNameEdit(user?.lastName || profile?.lastName || '');
    }
  }, [user?.firstName, user?.lastName, profile?.firstName, profile?.lastName]);

  // Clear all collapsible section states on mount to keep them closed
  useEffect(() => {
    const settingsKeys = [
      'collapsible:settings:profile',
      'collapsible:settings:password',
      'collapsible:settings:charities',
      'collapsible:settings:payment-prefs',
      'collapsible:settings:payment-methods'
    ];
    settingsKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore errors
      }
    });
  }, []);

  // Fetch charities from backend
  useEffect(() => {
    const fetchCharities = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await settingsAPI.getCharities();
        
        // Map backend charities to frontend format
        // User's selectedCharities are in user.selectedCharities
        const userSelectedCharities = user?.selectedCharities || [];
        
        const mappedCharities = (response.charities || []).map(charity => ({
          id: charity._id,
          name: charity.name,
          category: charity.category || 'General',
          active: userSelectedCharities.includes(charity._id) // Only active if user has selected it
        }));
        
        setCharities(mappedCharities);
      } catch (error) {
        console.error('Error fetching charities:', error);
        // Fallback to mock charities
        const mockCharities = [
          { id: 1, name: 'Save the Children', active: false, category: 'Education' },
          { id: 2, name: 'Doctors Without Borders', active: false, category: 'Healthcare' },
          { id: 3, name: 'World Wildlife Fund', active: false, category: 'Environment' },
          { id: 4, name: 'Red Cross', active: false, category: 'Emergency' },
          { id: 5, name: 'UNICEF', active: false, category: 'Children' },
          { id: 6, name: 'Amnesty International', active: false, category: 'Human Rights' },
          { id: 7, name: 'Feeding America', active: false, category: 'Hunger Relief' },
          { id: 8, name: 'Habitat for Humanity', active: false, category: 'Housing' },
          { id: 9, name: 'Oxfam', active: false, category: 'Global Development' },
          { id: 10, name: 'Greenpeace', active: false, category: 'Environment' }
        ];
        setCharities(mockCharities);
      }
    };

    fetchCharities();
  }, [isAuthenticated, user?.selectedCharities]);

  // Fetch payment preference
  useEffect(() => {
    if (user?.paymentPreference) {
      setPaymentMode(user.paymentPreference);
    }
  }, [user?.paymentPreference]);

  const handleCharityToggle = async (id) => {
    try {
      // Optimistic update
      setCharities(prev => 
        prev.map(charity => 
          charity.id === id 
            ? { ...charity, active: !charity.active }
            : charity
        )
      );
      
      // Call backend
      await settingsAPI.toggleCharity(id);
    } catch (error) {
      console.error('Error toggling charity:', error);
      // Revert on error
      setCharities(prev => 
        prev.map(charity => 
          charity.id === id 
            ? { ...charity, active: !charity.active }
            : charity
        )
      );
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleNameSave = async () => {
    const finalDisplay = [firstNameEdit, lastNameEdit].filter(Boolean).join(' ').trim();
    setDisplayName(finalDisplay || 'User');
    localStorage.setItem('userDisplayName', finalDisplay);
    await saveName(firstNameEdit, lastNameEdit);
  };

  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
  };

  const handleSavePaymentSettings = async () => {
    try {
      await settingsAPI.updatePaymentPreference(paymentMode);
      console.log('Payment settings saved successfully');
    } catch (error) {
      console.error('Error saving payment settings:', error);
    }
  };



  // Password strength validation
  const getPasswordStrength = (pwd) => {
    const minLen = pwd.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    
    const checks = { minLen, hasLetter, hasNumber, hasSymbol };
    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    let strength = 'weak';
    let color = 'red';
    if (passedChecks === 4) {
      strength = 'strong';
      color = 'green';
    } else if (passedChecks >= 3) {
      strength = 'medium';
      color = 'yellow';
    }
    
    return { checks, strength, color, passedChecks, totalChecks: 4 };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const isCurrentPassword = newPassword === currentPassword;

  const passwordValid = useMemo(() => {
    if (!newPassword || !confirmPassword) return false;
    const minLen = newPassword.length >= 8;
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const matches = newPassword === confirmPassword;
    const notCurrent = newPassword !== currentPassword;
    const ok = minLen && hasLetter && hasNumber && hasSymbol && matches && notCurrent;
    
    let errorMsg = '';
    if (!minLen) errorMsg = 'Minimum 8 characters required';
    else if (!hasLetter) errorMsg = 'Must contain at least one letter';
    else if (!hasNumber) errorMsg = 'Must contain at least one number';
    else if (!hasSymbol) errorMsg = 'Must contain at least one symbol (!@#$%^&*...)';
    else if (!matches) errorMsg = 'Passwords do not match';
    else if (!notCurrent) errorMsg = 'New password must be different from current password';
    
    setPasswordError(errorMsg);
    return ok;
  }, [newPassword, confirmPassword, currentPassword]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-headline text-gray-900 mb-2">Settings</h1>
          <p className="text-body text-gray-600">
            Manage your account preferences and donation settings.
          </p>
        </div>

        <div className="space-y-6">
          {showOnboarding && (
            <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-xl flex items-center justify-between">
              <div className="text-sm text-gray-800">
                Welcome! Quick setup: Pick charities → Set payment preferences → Add a payment method.
              </div>
              <RippleButton
                onClick={() => {
                  setShowOnboarding(false);
                  localStorage.removeItem('charitap_onboarding_show');
                  localStorage.setItem('charitap_onboarding_done', '1');
                  document.querySelector('[data-section="charities"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-black text-white rounded-full px-4 py-2 text-sm"
              >
                Start
              </RippleButton>
            </div>
          )}
          {/* Profile Section (form style) */}
          <CollapsibleSection 
            title="Profile Information" 
            defaultOpen={false}
            persistKey="settings:profile"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          >
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input 
                    type="text" 
                    value={firstNameEdit} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow letters, spaces, hyphens, and apostrophes
                      if (/^[a-zA-Z\s\-']*$/.test(value) || value === '') {
                        setFirstNameEdit(value);
                      }
                    }}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" 
                    placeholder="First name" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters only (2-50 characters)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input 
                    type="text" 
                    value={lastNameEdit} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow letters, spaces, hyphens, and apostrophes
                      if (/^[a-zA-Z\s\-']*$/.test(value) || value === '') {
                        setLastNameEdit(value);
                      }
                    }}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" 
                    placeholder="Last name" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters only (2-50 characters)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input type="email" value={email} readOnly className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-lg" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500" title="Email verified">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2c-1.1 0-2 .9-2 2H6a2 2 0 00-2 2v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6a2 2 0 00-2-2h-4c0-1.1-.9-2-2-2z"/>
                      <path fill="#fff" d="M10.5 13.5l-2-2 1.4-1.4 0.6 0.6 3-3 1.4 1.4-4.4 4.4z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <RippleButton onClick={handleNameSave} className="bg-black text-white hover:bg-yellow-300 hover:text-black px-5 py-2.5 rounded-full text-sm font-semibold">Save Profile</RippleButton>
              </div>
            </div>
          </CollapsibleSection>

          {/* Password Change Section */}
          {authProvider !== 'google' && (
          <CollapsibleSection 
            title="Password"
            defaultOpen={false}
            persistKey="settings:password"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          >
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-3 md:top-3.5 text-sm text-gray-500">
                    {showCurrent ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 8, letters, numbers & symbols)"
                      className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-3 md:top-3.5 text-sm text-gray-500">
                      {showNew ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password strength:</span>
                        <span className={`text-xs font-semibold ${
                          passwordStrength.color === 'green' ? 'text-green-600' :
                          passwordStrength.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {passwordStrength.strength.toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.color === 'green' ? 'bg-green-500' :
                            passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(passwordStrength.passedChecks / passwordStrength.totalChecks) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Password Requirements Checklist */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs">
                        <span className={`mr-2 ${passwordStrength.checks.minLen ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.minLen ? '✓' : '○'}
                        </span>
                        <span className={passwordStrength.checks.minLen ? 'text-green-600' : 'text-gray-600'}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className={`mr-2 ${passwordStrength.checks.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.hasLetter ? '✓' : '○'}
                        </span>
                        <span className={passwordStrength.checks.hasLetter ? 'text-green-600' : 'text-gray-600'}>
                          At least one letter
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className={`mr-2 ${passwordStrength.checks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.hasNumber ? '✓' : '○'}
                        </span>
                        <span className={passwordStrength.checks.hasNumber ? 'text-green-600' : 'text-gray-600'}>
                          At least one number
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className={`mr-2 ${passwordStrength.checks.hasSymbol ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordStrength.checks.hasSymbol ? '✓' : '○'}
                        </span>
                        <span className={passwordStrength.checks.hasSymbol ? 'text-green-600' : 'text-gray-600'}>
                          At least one symbol (!@#$%^&*...)
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className={`mr-2 ${!isCurrentPassword ? 'text-green-600' : 'text-red-400'}`}>
                          {!isCurrentPassword ? '✓' : '○'}
                        </span>
                        <span className={!isCurrentPassword ? 'text-green-600' : 'text-red-600'}>
                          Different from current password
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-3 md:top-3.5 text-sm text-gray-500">
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <div className="flex justify-end">
                <RippleButton
                  onClick={async () => {
                    if (!passwordValid) return;
                    try {
                      await changePassword(currentPassword, newPassword);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      toast.success('Password updated successfully! 🎉', {
                        position: 'top-right',
                        autoClose: 3000,
                      });
                    } catch (e) {
                      toast.error(e.message || 'Failed to update password', {
                        position: 'top-right',
                        autoClose: 4000,
                      });
                    }
                  }}
                  disabled={!passwordValid}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    passwordValid 
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-black' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Change Password
                </RippleButton>
              </div>
            </div>
          </CollapsibleSection>
          )}

          {/* Charities Section */}
          <CollapsibleSection 
            title="My Charities" 
            defaultOpen={false}
            persistKey="settings:charities"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          >
            <div className="space-y-4">
              <p className="text-body text-gray-600 mb-6">
                Choose which charities you'd like to support with your micro-donations.
                Toggle them on or off to control your donation preferences.
              </p>
              
              <div className="h-[420px] overflow-y-auto pr-2 pb-16 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 charities-scroll-container">
                {charities.map((charity, index) => (
                  <div 
                    key={charity.id} 
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md overflow-hidden min-h-[96px] ${
                      charity.active 
                        ? 'border-green-200 bg-green-50 shadow-sm' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Category icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          charity.active 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`font-semibold text-lg transition-colors duration-300 ${
                            charity.active ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {charity.name}
                          </h4>
                          <p className={`text-sm transition-colors duration-300 ${
                            charity.active ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {charity.category}
                          </p>
                        </div>
                      </div>
                      {/* Toggle Switch */}
                      <div className="flex items-center space-x-3">
                        <div
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 cursor-pointer ${
                            charity.active ? 'bg-green-500 shadow-lg' : 'bg-gray-300'
                          }`}
                          onClick={() => handleCharityToggle(charity.id)}
                          role="switch"
                          aria-checked={charity.active}
                          tabIndex={0}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                              charity.active ? 'translate-x-9' : 'translate-x-1'
                            }`}
                          />
                        </div>
                        <span className={`inline-block w-16 text-center text-sm font-medium transition-colors duration-300 ${
                          charity.active ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {charity.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Extra bottom space for last item visibility */}
              <div className="h-24" />
              </div>
            </div>
          </CollapsibleSection>

          {/* Payment Preferences Section */}
          <CollapsibleSection 
            title="Payment Preferences" 
            defaultOpen={false}
            persistKey="settings:payment-prefs"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          >
            <div className="space-y-6">
              <p className="text-body text-gray-600">
                Choose how you'd like to pay your accumulated donations to charities.
              </p>

              {/* Payment Mode Selection */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Payment Schedule</h4>
                
                <div className="grid md:grid-cols-2 gap-4 items-stretch">
                  {/* Monthly Payment Option */}
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] h-full flex flex-col min-h-[176px] ${
                      paymentMode === 'monthly' 
                        ? 'border-yellow-400 bg-yellow-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => handlePaymentModeChange('monthly')}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        paymentMode === 'monthly' 
                          ? 'border-yellow-500 bg-yellow-500' 
                          : 'border-gray-400'
                      }`}>
                        {paymentMode === 'monthly' && (
                          <div className="w-2 h-2 bg-white rounded-full transition-all duration-300"></div>
                        )}
                      </div>
                      <h5 className="font-semibold text-gray-900 transition-colors duration-300 hover:text-yellow-600">Monthly Payment</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 transition-colors duration-300 hover:text-gray-700">
                      Automatically donate all collected amounts at the end of each month.
                    </p>
                    <div className="mt-auto min-h-6">
                      {paymentMode === 'monthly' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-green-600 transition-all duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>All collected amounts will be donated automatically</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Threshold Payment Option */}
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] h-full flex flex-col min-h-[176px] ${
                      paymentMode === 'threshold' 
                        ? 'border-yellow-400 bg-yellow-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => handlePaymentModeChange('threshold')}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        paymentMode === 'threshold' 
                          ? 'border-yellow-500 bg-yellow-500' 
                          : 'border-gray-400'
                      }`}>
                        {paymentMode === 'threshold' && (
                          <div className="w-2 h-2 bg-white rounded-full transition-all duration-300"></div>
                        )}
                      </div>
                      <h5 className="font-semibold text-gray-900 transition-colors duration-300 hover:text-yellow-600">Threshold Payment</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 transition-colors duration-300 hover:text-gray-700">
                      Pay when your accumulated donations reach a certain amount.
                    </p>
                    <div className="mt-auto min-h-6">
                      {paymentMode === 'threshold' && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700"><span className="font-semibold">Threshold Amount:</span> $5 (fixed)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <RippleButton 
                  onClick={handleSavePaymentSettings}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
                >
                  Save Payment Settings
                </RippleButton>
              </div>
            </div>
          </CollapsibleSection>

          {/* Payment Methods (Stripe) */}
          <CollapsibleSection 
            title="Payment Methods"
            defaultOpen={false}
            persistKey="settings:payment-methods"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          >
            <Elements stripe={stripePromise}>
              <StripePaymentSection userEmail={email} displayName={displayName} />
            </Elements>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

function StripePaymentSection({ userEmail, displayName }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = React.useState('');
  const [savedMethods, setSavedMethods] = React.useState([]);
  const [cardholderName, setCardholderName] = React.useState(''); // Empty by default
  const [cardholderEmail, setCardholderEmail] = React.useState(''); // Empty by default
  const [cardZip, setCardZip] = React.useState('');
  const [defaultPmId, setDefaultPmId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchSavedMethods = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/api/stripe/list-payment-methods`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (!res.ok) {
        console.error('Failed to fetch payment methods');
        return;
      }
      
      const data = await res.json();
      if (data.paymentMethods) setSavedMethods(data.paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Silently fail - payment methods may not be set up yet
    }
  };

  React.useEffect(() => {
    if (userEmail) fetchSavedMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Don't pre-fill - let users enter their own information
  // React.useEffect(() => {
  //   setCardholderName(displayName || '');
  // }, [displayName]);
  // React.useEffect(() => {
  //   setCardholderEmail(userEmail || '');
  // }, [userEmail]);

  const validateInputs = () => {
    // Validate cardholder name (2-50 characters, letters, spaces, hyphens only)
    const nameRegex = /^[a-zA-Z\s\-]{2,50}$/;
    if (!cardholderName || !nameRegex.test(cardholderName.trim())) {
      setStatus('❌ Please enter a valid cardholder name (2-50 characters, letters only)');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cardholderEmail || !emailRegex.test(cardholderEmail)) {
      setStatus('❌ Please enter a valid email address');
      return false;
    }

    // Validate ZIP (5 digits for US)
    const zipRegex = /^\d{5}$/;
    if (!cardZip || !zipRegex.test(cardZip)) {
      setStatus('❌ Please enter a valid 5-digit ZIP code');
      return false;
    }

    return true;
  };

  const handleAttachCard = async () => {
    if (!stripe || !elements) {
      setStatus('❌ Stripe is not loaded. Please refresh the page.');
      return;
    }

    if (!validateInputs()) return;

    setStatus('');
    setIsLoading(true);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      
      // Create payment method with Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: cardholderName.trim(),
          email: cardholderEmail.trim(),
          address: {
            postal_code: cardZip.trim()
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to save payment method');
      }

      // Save payment method to backend
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/api/stripe/save-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save payment method');
      }

      const result = await response.json();
      
      setStatus(`✅ Card saved successfully! ${result.paymentMethod.brand.toUpperCase()} •••• ${result.paymentMethod.last4}`);
      
      // Clear form
      setCardholderName('');
      setCardholderEmail('');
      setCardZip('');
      cardNumberElement.clear();
      elements.getElement(CardExpiryElement).clear();
      elements.getElement(CardCvcElement).clear();

      // Refresh saved methods
      await fetchSavedMethods();
      
      // Show success toast
      toast.success('Payment method saved successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

    } catch (error) {
      console.error('Error saving card:', error);
      setStatus(`❌ ${error.message}`);
      toast.error(error.message || 'Failed to save payment method', {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add a new card</label>
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow letters, spaces, and hyphens
                  if (/^[a-zA-Z\s\-]*$/.test(value) || value === '') {
                    setCardholderName(value);
                  }
                }}
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="John Doe"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Letters, spaces, and hyphens only</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={cardholderEmail}
                onChange={(e) => setCardholderEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                value={cardZip}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow digits, max 5
                  if (/^\d*$/.test(value)) {
                    setCardZip(value);
                  }
                }}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="12345"
                required
              />
              <p className="text-xs text-gray-500 mt-1">5-digit ZIP code</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-gray-200">
            <CardNumberElement options={{ showIcon: true }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <CardExpiryElement />
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <CardCvcElement />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <RippleButton 
            onClick={handleAttachCard} 
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : 'Save Card'}
          </RippleButton>
        </div>
        {status && (
          <p className={`text-sm mt-2 font-medium ${
            status.includes('✅') ? 'text-green-600' : 'text-red-600'
          }`}>
            {status}
          </p>
        )}
      </div>

      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold">Saved Payment Methods</h4>
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-4 h-4 text-green-600 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm-1-6h2v2h-2v-2Zm0-8h2v6h-2V8Z"/></svg>
            Your payment information is securely processed via Stripe
          </div>
        </div>
        <div className="space-y-2 max-h-80 md:max-h-96 overflow-y-auto pr-2 pb-16">
          {savedMethods.length === 0 && (
            <p className="text-sm text-gray-600">No saved cards yet.</p>
          )}
          {savedMethods.map((pm) => (
            <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200">
              <div className="flex items-center gap-3">
                <img src={`/card-brands/${pm.card.brand}.svg`} alt={pm.card.brand} className="w-6 h-6" onError={(e)=>{e.currentTarget.style.display='none'}} />
                <span className="text-sm text-gray-700">{pm.card.brand.toUpperCase()} •••• {pm.card.last4}</span>
                <span className="text-xs text-gray-500">exp {pm.card.exp_month}/{pm.card.exp_year}</span>
              </div>
              <div className="flex items-center gap-2">
                <RippleButton
                  onClick={async () => {
                    await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/api/set-default-payment-method`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: userEmail, paymentMethodId: pm.id })
                    });
                    setDefaultPmId(pm.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${defaultPmId === pm.id ? 'bg-green-200 text-green-900' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
                >
                  {defaultPmId === pm.id ? 'Default' : 'Make default'}
                </RippleButton>
                <RippleButton
                  onClick={async () => {
                    await fetch(`${process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}/api/detach-payment-method`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ paymentMethodId: pm.id })
                    });
                    await fetchSavedMethods();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Remove
                </RippleButton>
              </div>
            </div>
          ))}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}