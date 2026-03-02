import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { GoogleOAuthProvider } from './auth/google';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/main.css';

// Lazy load components for better performance
const Home = lazy(() => import('./components/Home'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Activity = lazy(() => import('./components/Activity'));
const Settings = lazy(() => import('./components/Settings'));
const CharitiesPage = lazy(() => import('./components/CharitiesPage'));
const SignIn = lazy(() => import('./components/auth/SignIn'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const CompleteProfile = lazy(() => import('./components/auth/CompleteProfile'));
const NotFound = lazy(() => import('./components/NotFound'));

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
  const hideChrome = ['/signin', '/signup', '/complete-profile'].includes(location.pathname);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: REACT_APP_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {!hideChrome && <Navigation />}
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                {/* Public home currently not used */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
                <Route path="/activity" element={<ProtectedRoute component={Activity} />} />
                <Route path="/charities" element={<ProtectedRoute component={CharitiesPage} />} />
                <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          {!hideChrome && <Footer />}
        </div>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
