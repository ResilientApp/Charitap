import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/main.css';

const Navigation = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/transactions">Transactions</Link>
      <Link to="/charities">Charities</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/history">Donation History</Link>
      <Link to="/login" className="login-link">Login</Link>
    </nav>
  );
};

export default Navigation;