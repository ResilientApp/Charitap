import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import Breadcrumb from './Breadcrumb';
import useScrollAnimation from '../hooks/useScrollAnimation';
import { useActivitySync } from '../hooks/useRealTimeSync';
import { activityAPI } from '../services/api';
import { exportDonatedCSV, exportDonatedPDF, exportCollectedCSV, exportCollectedPDF } from '../utils/exportUtils';
import Confetti from './Confetti';
import { SkeletonActivity } from './Skeleton';
import TransactionCard from './TransactionCard';

export default function Activity() {
  // Scroll animation refs
  const headerRef = useScrollAnimation(0.3);
  const activityRef = useScrollAnimation(0.2);
  
  const { isAuthenticated } = useAuth();
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch activity data from backend
  const fetchActivityData = useCallback(async () => {
    console.log('Activity: isAuthenticated =', isAuthenticated);
    if (!isAuthenticated) {
      console.log('Activity: Not authenticated, skipping data fetch');
      setLoading(false);
      return;
    }
    
    // Don't show loading spinner on refresh if we already have data
    setLoading(prevLoading => activities.length === 0 ? true : false);
    try {
      console.log('Activity: Fetching data from backend...');
        
        // Fetch both collected and donated data
        const [collected, donated] = await Promise.all([
          activityAPI.getCollected().catch(err => { console.error('getCollected error:', err); return { data: [] }; }),
          activityAPI.getDonations().catch(err => { console.error('getDonations error:', err); return { data: [] }; })
        ]);

        console.log('Activity: Data received:', { collected, donated });

        // Combine both into activities list for display
        const combinedActivities = [];
        
        // Add donations - FIXED: backend returns 'data' array, not 'transactions'
        (donated.data || []).forEach((tx, idx) => {
          combinedActivities.push({
            id: `donation-${tx.id || idx}`,
            type: 'donation',
            charity: tx.charity?.name || 'Unknown Charity',  // FIXED: charity is an object with name
            amount: `$${parseFloat(tx.amount || 0).toFixed(2)}`,
            date: tx.date || new Date().toISOString(),
            category: tx.charity?.type || 'General',  // FIXED: use charity.type
            status: 'completed'
          });
        });

        // Add collected roundups - FIXED: backend returns 'data' array, not 'roundups'
        (collected.data || []).forEach((ru, idx) => {
          combinedActivities.push({
            id: `roundup-${ru.id || idx}`,
            type: 'roundup',
            charity: 'Round-Up Collection',
            amount: `$${parseFloat(ru.roundUpAmount || 0).toFixed(2)}`,
            date: ru.date || new Date().toISOString(),  // FIXED: backend returns 'date' not 'createdAt'
            category: 'Collection',
            status: ru.isPaid ? 'completed' : 'pending',  // FIXED: use isPaid to determine status
            purchaseAmount: ru.purchaseAmount
          });
        });

        // Sort by date (newest first)
        combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('Activity: Combined activities:', combinedActivities.length, 'items');
        setActivities(combinedActivities);
        
        // Celebrate milestones!
        if (combinedActivities.length === 10 || combinedActivities.length === 25 || combinedActivities.length === 50) {
          setTimeout(() => setShowConfetti(true), 300);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Activity: Error fetching activity data:', error);
        // Don't clear existing data on error - just stop loading
        setLoading(false);
      }
    }, [isAuthenticated, activities.length]);

    // Enable real-time synchronization with 5-second polling for activity updates
    useActivitySync(fetchActivityData);

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
  const collected = activities.filter(a => a.type === 'roundup');

  // Pagination logic
  const allVisible = tab === 'donated' ? donated : collected;
  const totalPages = Math.ceil(allVisible.length / ITEMS_PER_PAGE);
  const visible = allVisible.slice(0, page * ITEMS_PER_PAGE);
  const canLoadMore = page < totalPages;

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  // Reset page when tab changes
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Confetti trigger={showConfetti} duration={3000} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        {/* Header */}
        <div 
          ref={headerRef}
          className="scroll-animate mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-headline text-gray-900 mb-2">Activity</h1>
              <p className="text-body text-gray-600">
                Track your donation history and impact over time.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold ${tab === 'donated' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTabChange('donated')}
              aria-pressed={tab === 'donated'}
            >
              Donated ({donated.length})
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold ${tab === 'collected' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTabChange('collected')}
              aria-pressed={tab === 'collected'}
            >
              Collected ({collected.length})
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div 
          ref={activityRef}
          className="scroll-animate space-y-4"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}
        >
          {loading ? (
            // Show skeleton loaders while data is loading
            Array.from({ length: 5 }).map((_, index) => (
              <SkeletonActivity key={index} />
            ))
          ) : (
            <>
              {tab === 'donated' && (
                <>
                  {/* Export Buttons for Donated Tab */}
                  {visible.length > 0 && typeof exportDonatedCSV !== 'undefined' && (
                    <div className="flex justify-end gap-2 mb-4">
                      <button
                        onClick={() => exportDonatedCSV(visible)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
                        title="Download Donated CSV"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => exportDonatedPDF(visible)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
                        title="Download Donated PDF"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  )}

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {visible.map((activity, index) => (
                            <tr key={activity.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatActivityDate(activity.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.charity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{activity.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {visible.map((activity, index) => (
                      <TransactionCard key={activity.id} activity={activity} tab="donated" />
                    ))}
                  </div>
                </>
              )}
              {tab === 'collected' && (
                <>
                  {/* Export Buttons for Collected Tab */}
                  {visible.length > 0 && typeof exportCollectedCSV !== 'undefined' && (
                    <div className="flex justify-end gap-2 mb-4">
                      <button
                        onClick={() => exportCollectedCSV(visible)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
                        title="Download Collected CSV"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => exportCollectedPDF(visible)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
                        title="Download Collected PDF"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  )}

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round-Up Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {visible.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatActivityDate(item.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.purchaseAmount ? `$${parseFloat(item.purchaseAmount).toFixed(2)}` : '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">+{item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {visible.map((item, index) => (
                      <TransactionCard key={item.id} activity={item} tab="collected" />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Load More Button */}
        {visible.length > 0 && canLoadMore && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Load More
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Showing {visible.length} of {allVisible.length} {tab === 'donated' ? 'donations' : 'round-ups'}
            </p>
          </div>
        )}

        {/* All Loaded Message */}
        {visible.length > 0 && !canLoadMore && allVisible.length > ITEMS_PER_PAGE && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 font-medium">
              ✓ All {allVisible.length} {tab === 'donated' ? 'donations' : 'round-ups'} loaded
            </p>
          </div>
        )}

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
