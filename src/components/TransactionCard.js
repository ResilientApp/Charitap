import React from 'react';

// Helper function to format dates
const formatActivityDate = (input) => {
  if (!input) return '';
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) return input;

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

// Helper function to get activity icons
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
    default:
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Mobile Transaction Card Component for Collected Tab
export default function TransactionCard({ activity, tab }) {
  // For collected tab: show Purchase Amount and Round-Up Amount
  // For donated tab: show Charity and Donation Amount
  const isCollected = tab === 'collected' || activity.type === 'roundup';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-yellow-100">
            {getActivityIcon(activity.type)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {isCollected ? (
            // Collected Tab Layout
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-title text-gray-900 font-semibold">
                  Round-Up Collection
                </h3>
                {activity.amount && (
                  <span className="text-lg font-semibold text-green-600 transition-all duration-300 hover:scale-110">
                    +{activity.amount}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-gray-600">Purchase Amount:</span>
                  <span className="text-gray-900 font-medium">
                    {activity.purchaseAmount ? `$${parseFloat(activity.purchaseAmount).toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="text-caption text-gray-500">
                  {formatActivityDate(activity.date)}
                </div>
              </div>
            </>
          ) : (
            // Donated Tab Layout
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-title text-gray-900 truncate transition-colors duration-300 hover:text-yellow-600">
                  {activity.charity}
                </h3>
                {activity.amount && (
                  <span className="text-lg font-semibold text-blue-600 transition-all duration-300 hover:scale-110">
                    {activity.amount}
                  </span>
                )}
              </div>

              <div className="text-caption text-gray-500">
                {formatActivityDate(activity.date)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
