import React from 'react';
// Auth not required directly in this component
import Breadcrumb from './Breadcrumb';
import RippleButton from './RippleButton';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function Activity() {
  // Scroll animation refs
  const headerRef = useScrollAnimation(0.3);
  const activityRef = useScrollAnimation(0.2);

  const activities = [
    {
      id: 1,
      type: 'donation',
      charity: 'Save the Children',
      amount: '$2.45',
      date: '2 hours ago',
      category: 'Education',
      status: 'completed'
    },
    {
      id: 2,
      type: 'donation',
      charity: 'Doctors Without Borders',
      amount: '$1.78',
      date: '5 hours ago',
      category: 'Healthcare',
      status: 'completed'
    },
    {
      id: 3,
      type: 'charity_added',
      charity: 'World Wildlife Fund',
      amount: null,
      date: '1 day ago',
      category: 'Environment',
      status: 'completed'
    },
    {
      id: 4,
      type: 'donation',
      charity: 'Red Cross',
      amount: '$3.12',
      date: '2 days ago',
      category: 'Emergency',
      status: 'pending'
    },
    {
      id: 5,
      type: 'goal_reached',
      charity: 'Monthly Goal',
      amount: '$50.00',
      date: '3 days ago',
      category: 'Achievement',
      status: 'completed'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'donation':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const donationActivities = activities.filter(activity => activity.type === 'donation');

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

        {/* Activity List */}
        <div 
          ref={activityRef}
          className="scroll-animate space-y-4"
        >
          {donationActivities.map((activity, index) => (
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
                        {activity.date}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {donationActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-title text-gray-900 mb-2">No activities found</h3>
            <p className="text-body text-gray-600 mb-6">
              You haven't made any donations yet. Start making a difference today!
            </p>
            <RippleButton className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium">
              Make Your First Donation
            </RippleButton>
          </div>
        )}
      </div>
    </div>
  );
};
