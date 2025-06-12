// src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'react-toastify';

export default function ProtectedRoute({ element: Component }) {
  const { isAuthenticated, isLoading } = useAuth0();
  const [redirect, setRedirect] = useState(false);

  // when we know auth status and it's false, kick off toast + delayed redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.info('Please log in to view that page.', { autoClose: 2000 });
      const timer = setTimeout(() => setRedirect(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  // 1) Loading spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{ borderColor: 'rgba(245,236,213,0.8)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // 2) Not authenticated → show overlay then redirect
  if (!isAuthenticated) {
    if (redirect) {
      return <Navigate to="/" replace />;
    }
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
        <div className="bg-card p-8 rounded-2xl fade-in max-w-sm text-center">
          <p className="text-2xl font-semibold text-[#626F47] mb-4">
            Whoops!
          </p>
          <p className="text-gray-700 mb-2">
            You need to be logged in to access that page.
          </p>
          <p className="text-gray-500 italic">
            Redirecting you back...
          </p>
        </div>
      </div>
    );
  }

  // 3) Authenticated → render the page with a fade-in
  return (
    <div className="fade-in">
      <Component />
    </div>
  );
}
