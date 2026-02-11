import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { GoogleOAuthProvider } from './auth/google';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/main.css';
import './styles/responsive.css';

// Lazy load components for better performance
const Home = lazy(() => import('./components/Home'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Activity = lazy(() => import('./components/Activity'));
const Settings = lazy(() => import('./components/Settings'));
const SignIn = lazy(() => import('./components/auth/SignIn'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const CompleteProfile = lazy(() => import('./components/auth/CompleteProfile'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
    <div className="text-center">
      <div className="spinner mx-auto mb-4"></div>
      <p className="text-gray-600 animate-pulse">Loading Charitap...</p>
    </div>
  </div>
);

function App() {
  const { isLoading } = useAuth();
  const location = useLocation();
  const hideChrome = ['/signin','/signup','/complete-profile'].includes(location.pathname);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_google_client_id_here'}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {!hideChrome && <Navigation />}
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    {/* Public home currently not used */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
                    <Route path="/activity" element={<ProtectedRoute element={Activity} />} />
                    <Route path="/settings" element={<ProtectedRoute element={Settings} />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>
          {!hideChrome && <Footer />}
        </div>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
