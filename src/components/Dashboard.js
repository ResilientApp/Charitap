import React from 'react';
import { useAuth } from '../auth/AuthContext';
import Breadcrumb from './Breadcrumb';
import CollapsibleSection from './CollapsibleSection';
// import RippleButton from './RippleButton';
import useScrollAnimation from '../hooks/useScrollAnimation';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  
  // Scroll animation refs
  const statsRef = useScrollAnimation(0.3);

  const stats = [
    { label: 'Total Donations', value: '$4,567.89' },
    { label: 'This Month', value: '$89.45' },
    { label: 'Charities Supported', value: '24' },
    { label: 'Collected', value: '$4.56' }
  ];

  const recentDonations = [
    { charity: 'Save the Children', amount: '$2.45', category: 'Education' },
    { charity: 'Doctors Without Borders', amount: '$1.78', category: 'Healthcare' },
    { charity: 'World Wildlife Fund', amount: '$3.12', category: 'Environment' },
    { charity: 'Red Cross', amount: '$1.23', category: 'Emergency' }
  ];

  // Chart data
  const monthlySpendingData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Donations',
        data: [45, 52, 38, 67, 89, 76, 92, 85, 78, 95, 88, 102],
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgba(251, 191, 36, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const charitiesSupportedData = {
    labels: ['Save the Children', 'Doctors Without Borders', 'World Wildlife Fund', 'Red Cross', 'UNICEF', 'Others'],
    datasets: [
      {
        data: [25, 20, 15, 12, 10, 18],
        backgroundColor: [
          '#F59E0B',
          '#10B981',
          '#3B82F6',
          '#EF4444',
          '#8B5CF6',
          '#6B7280'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-headline text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-body text-gray-600">
            Here's your donation impact and activity summary.
          </p>
        </div>

        {/* Stats Cards */}
        <div 
          ref={statsRef}
          className="scroll-animate grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-2">
                <h3 className="text-caption text-gray-600">{stat.label}</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Analytics Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 hover:shadow-md transition-all duration-300">
          <div className="p-6">
            <div className="space-y-8">
              {/* Monthly Spending Chart */}
              <CollapsibleSection 
                title="Monthly Donation Trends" 
                defaultOpen={true}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              >
                <div className="p-4">
                  <div className="h-80 transform transition-all duration-500 hover:scale-[1.02]">
                    <Bar data={monthlySpendingData} options={barChartOptions} />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Your donation activity over the past 12 months
                    </p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Charities Supported Chart */}
              <CollapsibleSection 
                title="Charities Supported" 
                defaultOpen={true}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              >
                <div className="p-4">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="h-80 transform transition-all duration-500 hover:scale-[1.02]">
                      <Doughnut data={charitiesSupportedData} options={chartOptions} />
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Donation Distribution</h4>
                      {charitiesSupportedData.labels.map((label, index) => (
                        <div key={index} className="flex items-center justify-between transform transition-all duration-300 hover:scale-105">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: charitiesSupportedData.datasets[0].backgroundColor[index] }}
                            ></div>
                            <span className="text-sm text-gray-700">{label}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {charitiesSupportedData.datasets[0].data[index]}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
