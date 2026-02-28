import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import Breadcrumb from './Breadcrumb';
import useScrollAnimation from '../hooks/useScrollAnimation';
import useRealTimeSync from '../hooks/useRealTimeSync';
import { activityAPI } from '../services/api';

export default function Activity() {
  // Scroll animation refs
  const headerRef = useScrollAnimation(0.3);
  const activityRef = useScrollAnimation(0.2);
  
  const { isAuthenticated } = useAuth();
  const [activities, setActivities] = useState([]);

  // Stable fetch function — wrapped in useCallback so the hook gets a stable reference
  const fetchActivityData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const [collected, donated] = await Promise.all([
      activityAPI.getCollected().catch(() => ({ data: [] })),
      activityAPI.getDonations().catch(() => ({ data: [] }))
    ]);

    const combinedActivities = [];

    (donated.data || []).forEach((tx, idx) => {
      combinedActivities.push({
        id: `donation-${tx.id || idx}`,
        type: 'donation',
        charity: tx.charity?.name || 'Unknown Charity',
        amount: `$${parseFloat(tx.amount || 0).toFixed(2)}`,
        date: tx.date || new Date().toISOString(),
        category: tx.charity?.type || 'General',
        status: 'completed'
      });
    });

    (collected.data || []).forEach((ru, idx) => {
      combinedActivities.push({
        id: `roundup-${ru.id || idx}`,
        type: 'roundup',
        charity: 'Round-Up Collection',
        amount: `$${parseFloat(ru.roundUpAmount || 0).toFixed(2)}`,
        date: ru.date || new Date().toISOString(),
        category: 'Collection',
        status: ru.isPaid ? 'completed' : 'pending',
        purchaseAmount: ru.purchaseAmount
      });
    });

    combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    setActivities(combinedActivities);
  }, [isAuthenticated]);

  // Auto-refresh every 45s — pauses on hidden tab, resumes instantly on return
  const { refresh: refreshActivity } = useRealTimeSync(fetchActivityData, 45000, isAuthenticated);

  // React immediately when background.js broadcasts a wallet update
  // (fired after every successful round-up via chrome.scripting.executeScript → postMessage)
  useEffect(() => {
    const handleWalletUpdate = (event) => {
      if (event.data && event.data.type === 'CHARITAP_WALLET_UPDATE') {
        console.log('[Activity] Wallet update received, refreshing...');
        refreshActivity();
      }
    };
    window.addEventListener('message', handleWalletUpdate);
    return () => window.removeEventListener('message', handleWalletUpdate);
  }, [refreshActivity]);


  const getActivityIcon = (type) => {
    switch (type) {
      case 'donation':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'roundup':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'charity_added':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'goal_reached':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatActivityDate = (input) => {
    if (!input) return '';
    
    try {
      const date = new Date(input);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return input;
      
      // Format: "Oct 11, 2025 at 11:51 PM"
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleString('en-US', options);
    } catch (e) {
      return input;
    }
  };

  const [tab, setTab] = useState('donated'); // 'donated' | 'collected'
  const donated = activities.filter(a => a.type === 'donation');
  // Collected section: show round-ups collected
  const collected = activities.filter(a => a.type === 'roundup');
  const visible = tab === 'donated' ? donated : collected;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        {/* Header */}
        <div 
          ref={headerRef}
          className="scroll-animate mb-8"
        >
          <h1 className="text-headline text-gray-900 mb-2">Activity</h1>
          <p className="text-body text-gray-600">
            Track your donation history and impact over time.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold ${tab==='donated' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setTab('donated')}
              aria-pressed={tab==='donated'}
            >
              Donated
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold ${tab==='collected' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setTab('collected')}
              aria-pressed={tab==='collected'}
            >
              Collected
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div 
          ref={activityRef}
          className="scroll-animate space-y-4"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}
        >
          {tab === 'donated' && visible.map((activity, index) => (
            <div 
              key={activity.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-yellow-100">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-title text-gray-900 truncate transition-colors duration-300 hover:text-yellow-600">
                      {activity.charity}
                    </h3>
                    {activity.amount && (
                      <span className="text-lg font-semibold text-green-600 transition-all duration-300 hover:scale-110">
                        {activity.amount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-caption text-gray-600 transition-colors duration-300 hover:text-gray-800">
                        {activity.category}
                      </span>
                      <span className="text-caption text-gray-500 transition-colors duration-300 hover:text-gray-700">
                        {formatActivityDate(activity.date)}
                      </span>
                    </div>
                    {/* Status badge removed */}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {tab === 'collected' && collected.map((item, index) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{formatActivityDate(item.date)}</div>
                <div className="text-lg font-semibold text-green-600">{item.amount}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {visible.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-title text-gray-900 mb-2">
              {tab === 'donated' ? 'No Donations Yet' : 'No Round-Ups Collected'}
            </h3>
            <p className="text-body text-gray-600 mb-6">
              {tab === 'donated' 
                ? "You haven't made any donations yet. Start making a difference today!"
                : "You haven't collected any round-ups yet. Make some purchases to start rounding up!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
