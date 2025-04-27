import React from 'react';
import '../styles/main.css';

const DonationHistory = () => {
  const donations = [
    { month: 'July 2023', amount: 5.25 },
    { month: 'June 2023', amount: 4.75 },
    { month: 'May 2023', amount: 6.00 },
  ];

  const total = donations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <div className="history-container">
      <h2>Donation History</h2>
      <div className="total-donations">
        <h3>Total Donated: ${total.toFixed(2)}</h3>
      </div>
      <div className="monthly-donations">
        {donations.map((donation) => (
          <div key={donation.month} className="donation-item">
            <span>{donation.month}</span>
            <span>${donation.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationHistory;