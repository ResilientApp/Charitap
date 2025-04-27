import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import '../styles/main.css';

const data = [
  { month: 'Jan', donations: 12 },
  { month: 'Feb', donations: 15 },
  { month: 'Mar', donations: 8 },
  { month: 'Apr', donations: 20 },
];

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h2>Spending Dashboard</h2>
      <div className="charts">
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="donations" fill="#8884d8" />
        </BarChart>
      </div>
    </div>
  );
};

export default Dashboard;