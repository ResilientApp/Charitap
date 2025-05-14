import React from 'react';
<<<<<<< HEAD
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
=======
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth0 } from '@auth0/auth0-react';

import Navigation from './components/Navigation';
import Home         from './components/Home';
import HomePublic   from './components/HomePublic';
import Activity     from './components/Activity';
import Dashboard    from './components/Dashboard';
import Settings     from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';
>>>>>>> bb38d56 (Built complete reactand tailwind based  website)

function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  // while loading, you could show a spinner instead
  if (isLoading) return null;

  return (
    <Router>
<<<<<<< HEAD
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
=======
      <div className="App max-w-6xl mx-auto">
        <Navigation />
        <ToastContainer position="top-right" />

        <Routes>
          {/* Choose which home to show */}
          <Route
            path="/"
            element={isAuthenticated ? <Home /> : <HomePublic />}
          />

          <Route
            path="/activity"
            element={<ProtectedRoute element={Activity} />}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={Dashboard} />}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute element={Settings} />}
          />
>>>>>>> bb38d56 (Built complete reactand tailwind based  website)
        </Routes>
      </div>
    </Router>
  );
}

export default App;