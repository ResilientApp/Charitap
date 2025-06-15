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

function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  // while loading, you could show a spinner instead
  if (isLoading) return null;

  return (
    <Router>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;