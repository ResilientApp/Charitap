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

    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        "hmadgdapmiiiimdhebjchcocnjennahi",
        { type: "SAVE_USER_ID", userId: userId },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(`Website: Error sending message to extension hmadgdapmiiiimdhebjchcocnjennahi: ${chrome.runtime.lastError.message}`);
            // Consider UI feedback for the user if critical
          } else if (response && response.status === "success") {
            console.log(`Website: User ID successfully sent to extension. Response: ${response.message}`);
          } else {
            console.warn(`Website: Extension response indicates an issue or no acknowledgment:`, response);
          }
        }
      );
    } else {
      console.warn("Website: Chrome runtime not available. Cannot send message to extension. Is it installed and enabled?");
    }

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
