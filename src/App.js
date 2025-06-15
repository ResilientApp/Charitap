import React from 'react';
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
import { useEffect } from 'react';


function App() {
  const { isAuthenticated, isLoading, user } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user) {
      const email = user.email;
      const userId = user.sub;

      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', userId);

      console.log("Stored Email:", email);
      console.log("Stored UserID:", userId);
    }
  }, [isAuthenticated, user]);

  // ✅ Move this AFTER the hook
  if (isLoading) return null;

  return (
    <Router>
      <div className="App max-w-6xl mx-auto">
        <Navigation />
        <ToastContainer position="top-right" />

        <Routes>
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
        </Routes>
      </div>
    </Router>
  );
}


export default App;
