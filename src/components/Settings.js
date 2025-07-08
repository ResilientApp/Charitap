import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Breadcrumb from './Breadcrumb';
import CollapsibleSection from './CollapsibleSection';
import RippleButton from './RippleButton';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function Settings() {
  const { user, logout } = useAuth0();
  const [displayName, setDisplayName] = useState(() => {
    // Get name from localStorage or use user's name as fallback
    const savedName = localStorage.getItem('userDisplayName');
    return savedName || user?.name || 'User';
  });
  const [isEditingName, setIsEditingName] = useState(false);
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
  const [thresholdAmount, setThresholdAmount] = useState(25);

  // Scroll animation refs
  const profileRef = useScrollAnimation(0.3);
  const charitiesRef = useScrollAnimation(0.2);

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
    logout({ returnTo: window.location.origin });
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    // Save the name to localStorage for persistence
    localStorage.setItem('userDisplayName', displayName);
    console.log('Saving name:', displayName);
  };

  const handleNameCancel = () => {
    const savedName = localStorage.getItem('userDisplayName');
    setDisplayName(savedName || user?.name || 'User');
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
            defaultOpen={true}
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
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                    <div className="flex space-x-2">
                      <RippleButton 
                        onClick={handleNameSave}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Save
                      </RippleButton>
                      <RippleButton 
                        onClick={handleNameCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Cancel
                      </RippleButton>
                </div>
              </div>
                ) : (
                  <div>
                    <h3 className="text-title text-gray-900">{displayName}</h3>
                    <p className="text-body text-gray-600">{user?.email}</p>
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

          {/* Charities Section */}
          <CollapsibleSection 
            title="My Charities" 
            defaultOpen={true}
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
              
              <div className="h-[400px] overflow-y-auto pr-2 pb-8 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 charities-scroll-container">
                {charities.map((charity, index) => (
                  <div 
                    key={charity.id} 
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${
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
                <div className="h-8" />
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
            defaultOpen={true}
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
                        <label className="block text-sm font-medium text-gray-700 transition-colors duration-300 hover:text-gray-900">
                          Threshold Amount ($)
                        </label>
                        <input
                          type="number"
                          value={thresholdAmount}
                          onChange={(e) => setThresholdAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 hover:border-yellow-300"
                          min="1"
                          max="500"
                        />
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

          {/* Account Actions */}
          <CollapsibleSection 
            title="Account Actions" 
            defaultOpen={false}
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
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Sign Out
                </RippleButton>
                <RippleButton className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">
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