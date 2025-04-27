import React from 'react';
import '../styles/main.css';

const Transactions = () => {
  // Sample data - will be replaced with real data from backend
  const transactions = [
    { id: 1, date: '2023-08-01', amount: 24.99, roundup: 0.01 },
    { id: 2, date: '2023-08-02', amount: 49.95, roundup: 0.05 },
  ];

  return (
    <div className="transactions-container">
      <h2>Transaction History</h2>
      <div className="transaction-options">
        <button>Withdraw at $5</button>
        <button>Withdraw Monthly</button>
      </div>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <span>{transaction.date}</span>
            <span>${transaction.amount}</span>
            <span>RoundUp: ${transaction.roundup}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
