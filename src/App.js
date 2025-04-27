import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navigation            from './components/Navigation';
import ProtectedRoute       from './components/ProtectedRoute';
import Home                 from './components/Home';
import Transactions         from './components/Transactions';
import CharitySelection     from './components/CharitySelection';
import Dashboard            from './components/Dashboard';
import DonationHistory      from './components/DonationHistory';
import Login                from './components/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* All other routes require auth */}
          <Route path="/"           element={<ProtectedRoute element={Home} />} />
          <Route path="/transactions" element={<ProtectedRoute element={Transactions} />} />
          <Route path="/charities"    element={<ProtectedRoute element={CharitySelection} />} />
          <Route path="/dashboard"    element={<ProtectedRoute element={Dashboard} />} />
          <Route path="/history"      element={<ProtectedRoute element={DonationHistory} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;