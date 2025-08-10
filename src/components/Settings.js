import React, { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Breadcrumb from './Breadcrumb';
import CollapsibleSection from './CollapsibleSection';
import RippleButton from './RippleButton';
import {loadStripe} from '@stripe/stripe-js';
import {Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements} from '@stripe/react-stripe-js';

const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  // eslint-disable-next-line no-console
  console.error('Missing REACT_APP_STRIPE_PUBLIC_KEY in environment.');
}
const stripePromise = loadStripe(stripePublicKey || '');

export default function Settings() {
  const { user, profile, email, saveName, changePassword, logout, authProvider } = useAuth();
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstNameEdit, setFirstNameEdit] = useState(() => (displayName?.split(' ')[0] || ''));
  const [lastNameEdit, setLastNameEdit] = useState(() => (displayName?.split(' ').slice(1).join(' ') || ''));
  const [charities, setCharities] = useState([
    { id: 1, name: 'Save the Children', active: true, category: 'Education' },
    { id: 2, name: 'Doctors Without Borders', active: true, category: 'Healthcare' },
    { id: 3, name: 'World Wildlife Fund', active: false, category: 'Environment' },
    { id: 4, name: 'Red Cross', active: true, category: 'Emergency' },
    { id: 5, name: 'UNICEF', active: false, category: 'Children' },
    { id: 6, name: 'Amnesty International', active: false, category: 'Human Rights' }
  ]);

  // Payment preferences state
  const [paymentMode, setPaymentMode] = useState('monthly'); // 'monthly' or 'threshold'
  const [thresholdAmount] = useState(5);

  // Scroll animation refs
  // removed scroll animations for stability during testing

  const handleCharityToggle = (id) => {
    setCharities(prev => 
      prev.map(charity => 
        charity.id === id 
          ? { ...charity, active: !charity.active }
          : charity
      )
    );
  };

  const handleLogout = () => {
    logout();
  };

  const handleNameEdit = () => {
    const parts = (displayName || '').split(' ');
    setFirstNameEdit(parts[0] || '');
    setLastNameEdit(parts.slice(1).join(' ') || '');
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    const finalDisplay = [firstNameEdit, lastNameEdit].filter(Boolean).join(' ').trim();
    setDisplayName(finalDisplay || 'User');
    setIsEditingName(false);
    localStorage.setItem('userDisplayName', finalDisplay);
    await saveName(firstNameEdit, lastNameEdit);
  };

  const handleNameCancel = () => {
    const savedName = localStorage.getItem('userDisplayName');
    setDisplayName(savedName || (profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : (user?.displayName || 'User')) || 'User');
    setIsEditingName(false);
  };

  const handlePaymentModeChange = (mode) => {
    setPaymentMode(mode);
  };

  const handleSavePaymentSettings = () => {
    // Here you would typically save the payment settings to your backend
    console.log('Saving payment settings:', {
      paymentMode,
      thresholdAmount
    });
  };

  const scrollToBottom = () => {
    const charitiesContainer = document.querySelector('.charities-scroll-container');
    if (charitiesContainer) {
      charitiesContainer.scrollTo({
        top: charitiesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const passwordValid = useMemo(() => {
    if (!newPassword || !confirmPassword) return false;
    const minLen = newPassword.length >= 8;
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const matches = newPassword === confirmPassword;
    const ok = minLen && hasLetter && hasNumber && matches;
    setPasswordError(
      ok ? '' : !minLen ? 'Minimum 8 characters' : !hasLetter || !hasNumber ? 'Use letters and numbers' : !matches ? 'Passwords do not match' : ''
    );
    return ok;
  }, [newPassword, confirmPassword]);

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
          {/* Profile Section */}
          <CollapsibleSection 
            title="Profile Information" 
            defaultOpen={false}
            persistKey="settings:profile"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            <div className="space-y-4">
              <div className="flex-1">
                {isEditingName ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                        <input
                          type="text"
                          value={firstNameEdit}
                          onChange={(e) => setFirstNameEdit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                        <input
                          type="text"
                          value={lastNameEdit}
                          onChange={(e) => setLastNameEdit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <RippleButton 
                        onClick={handleNameSave}
                        className="bg-black text-white hover:bg-yellow-300 hover:text-black px-5 py-2.5 rounded-full text-sm font-semibold"
                      >
                        Save
                      </RippleButton>
                      <RippleButton 
                        onClick={handleNameCancel}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-full text-sm font-semibold"
                      >
                        Cancel
                      </RippleButton>
                </div>
              </div>
                ) : (
                  <div>
                    <h3 className="text-title text-gray-900">{displayName}</h3>
                    <p className="text-body text-gray-600">{email}</p>
                  </div>
                )}
              </div>
              {!isEditingName && (
                <RippleButton 
                  onClick={handleNameEdit}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Edit Name
                </RippleButton>
              )}
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
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8, letters & numbers)"
                    className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-3 md:top-3.5 text-sm text-gray-500">
                    {showNew ? 'Hide' : 'Show'}
                  </button>
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
                      alert('Password updated successfully');
                    } catch (e) {
                      alert(e.message);
                    }
                  }}
                  className={`bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-full text-sm font-semibold ${passwordValid ? '' : 'opacity-60 cursor-not-allowed'}`}
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
              
              <div className="h-[420px] overflow-y-auto pr-2 pb-12 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 charities-scroll-container">
                {charities.map((charity, index) => (
                  <div 
                    key={charity.id} 
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md overflow-hidden ${
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
                        <span className={`text-sm font-medium transition-colors duration-300 ${
                          charity.active ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {charity.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Extra bottom space for last item visibility */}
                <div className="h-16" />
              </div>
              <div className="flex justify-end mt-2">
                <RippleButton
                  onClick={scrollToBottom}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                  Scroll to Bottom
                </RippleButton>
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
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Monthly Payment Option */}
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
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

                  {/* Threshold Payment Option */}
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
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
                    {paymentMode === 'threshold' && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700"><span className="font-semibold">Threshold Amount:</span> $5 (fixed)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <RippleButton 
                  onClick={handleSavePaymentSettings}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:rotate-1 shadow-lg hover:shadow-xl"
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

          {/* Account Actions */}
          <CollapsibleSection 
            title="Account Actions" 
            defaultOpen={false}
            persistKey="settings:account-actions"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RippleButton 
                  onClick={handleLogout}
                  className="bg-black text-white hover:bg-yellow-300 hover:text-black px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200"
                >
                  Sign Out
                </RippleButton>
                <RippleButton className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200">
                  Delete Account
                </RippleButton>
              </div>
            </div>
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
  const [cardholderName, setCardholderName] = React.useState(displayName || '');
  const [cardholderEmail, setCardholderEmail] = React.useState(userEmail || '');
  const [cardZip, setCardZip] = React.useState('');
  const [defaultPmId, setDefaultPmId] = React.useState('');

  const fetchSavedMethods = async () => {
    const res = await fetch('http://localhost:4242/api/list-payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    const data = await res.json();
    if (data.paymentMethods) setSavedMethods(data.paymentMethods);
    // Attempt to get default from first card's customer if available via separate call is not available; skip for now
  };

  React.useEffect(() => {
    if (userEmail) fetchSavedMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  React.useEffect(() => {
    setCardholderName(displayName || '');
  }, [displayName]);
  React.useEffect(() => {
    setCardholderEmail(userEmail || '');
  }, [userEmail]);

  const handleAttachCard = async () => {
    if (!stripe || !elements) return;
    setStatus('');
    try {
      const res = await fetch('http://localhost:4242/api/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: displayName })
      });
      const data = await res.json();
      if (!data.clientSecret) throw new Error(data.error || 'Failed to create setup intent');

      const cardNumber = elements.getElement(CardNumberElement);
      const result = await stripe.confirmCardSetup(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            email: cardholderEmail || userEmail,
            name: cardholderName || displayName,
            address: { postal_code: cardZip || undefined }
          }
        }
      });
      if (result.error) throw result.error;
      setStatus('Card saved successfully');
      await fetchSavedMethods();
    } catch (e) {
      setStatus(e.message);
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
                onChange={(e) => setCardholderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={cardholderEmail}
                onChange={(e) => setCardholderEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                value={cardZip}
                onChange={(e) => setCardZip(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="ZIP"
              />
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
          <RippleButton onClick={handleAttachCard} className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium">Save Card</RippleButton>
        </div>
        {status && <p className="text-sm mt-2 text-gray-600">{status}</p>}
      </div>

      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
        <h4 className="text-lg font-semibold mb-3">Saved Payment Methods</h4>
        <div className="space-y-2">
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
                    await fetch('http://localhost:4242/api/set-default-payment-method', {
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
                    await fetch('http://localhost:4242/api/detach-payment-method', {
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
        </div>
      </div>
    </div>
  );
}