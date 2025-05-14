import React, { useState } from 'react';

export default function Activity() {
  const [transactions] = useState([
    { date: '2025-05-01', time: '14:32', amount: 24.99, roundup: 0.01 },
    { date: '2025-05-02', time: '09:17', amount: 49.95, roundup: 0.05 },
  ]);

  const [history] = useState([
    { date: '2025-04-30', donated: 5.0, charities: ['Red Cross'] },
    { date: '2025-04-01', donated: 15.25, charities: ['UNICEF', 'WWF'] },
  ]);

  return (
    <div className="page-content fade-in space-y-8">
      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-xl mb-4 text-[#626F47] slide-in-left">
          Recent Transactions
        </h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Date</th>
              <th className="py-2">Time</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Round-up</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr
                key={i}
                className="border-b last:border-none fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <td className="py-2">{tx.date}</td>
                <td className="py-2">{tx.time}</td>
                <td className="py-2">${tx.amount.toFixed(2)}</td>
                <td className="py-2">${tx.roundup.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Donation History */}
      <div className="bg-card rounded-2xl p-6">
        <h3 className="text-xl mb-4 text-[#626F47] slide-in-left">
          Donation History
        </h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Date</th>
              <th className="py-2">Donated</th>
              <th className="py-2">Charities</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr
                key={i}
                className="border-b last:border-none fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <td className="py-2">{h.date}</td>
                <td className="py-2 text-black">${h.donated.toFixed(2)}</td>
                <td className="py-2">{h.charities.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
