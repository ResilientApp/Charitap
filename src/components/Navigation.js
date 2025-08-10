import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-toastify';
import { useSwipeable } from 'react-swipeable';
import CountUp from 'react-countup';

const pages = [
  { to: '/', label: 'Home' },
  { to: '/activity', label: 'Activity' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/settings', label: 'Settings' },
];

export default function Navigation() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Sample data for Total Donations
  const totalDonations = 4567.89;

  const guard = (e, to) => {
    if (!isLoading && !isAuthenticated && to !== '/') {
      e.preventDefault();
      toast.info(
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.2" /><path d="M12 16v-4m0-4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/></svg>
          </span>
          <span className="text-gray-700 font-semibold">Please log in first.</span>
        </div>,
        {
          style: {
            background: '#fff',
            borderRadius: '12px',
            color: '#222',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
            fontSize: '1rem',
            padding: '1rem 1.5rem',
            minWidth: '260px',
          },
          icon: false,
          progressStyle: { background: '#3B82F6' },
        }
      );
      nav('/');
    }
  };

  // Swipe handlers for mobile navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!menuOpen) {
        setMenuOpen(true);
        toast.info('Menu opened! Swipe right to close.', { autoClose: 1500 });
      }
    },
    onSwipedRight: () => {
      if (menuOpen) {
        setMenuOpen(false);
      }
    },
    trackMouse: false,
    preventDefaultTouchmoveEvent: true,
    delta: 50, // Minimum swipe distance
    swipeDuration: 500, // Maximum time for swipe
  });

  return (
    <header className="bg-[#FCF8F1] sticky top-0 z-30 shadow-md w-full" role="banner" {...swipeHandlers}>
      <div className="flex items-center justify-between h-16 lg:h-20 w-full px-4 sm:px-6 lg:px-8">
          <div className="flex-shrink-0">
            <NavLink to="/" className="flex items-center space-x-2 group" aria-label="Go to home page">
              <img className="w-auto h-8 sm:h-10" src="/logo.png" alt="Charitap Logo" />
              <span className="font-extrabold text-xl sm:text-2xl text-yellow-400 tracking-tight group-hover:text-yellow-500 transition">Charitap</span>
            </NavLink>
          </div>

          <button
            type="button"
            className="inline-flex p-2 text-black transition-all duration-200 rounded-md lg:hidden focus:bg-gray-100 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg className={`${menuOpen ? 'hidden' : 'block'} w-6 h-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            <svg className={`${menuOpen ? 'block' : 'hidden'} w-6 h-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <nav className="hidden lg:flex lg:items-center lg:justify-center lg:space-x-8 xl:space-x-10" aria-label="Main navigation">
            {pages.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={e => guard(e, to)}
                className={({ isActive }) =>
                  `text-base text-black transition-all duration-200 hover:text-opacity-80 relative group ${isActive ? 'font-bold underline' : ''}`
                }
                title={`Go to ${label} page`}
              >
                {label}
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Show donation badges when authenticated */}
            {(!isLoading && isAuthenticated) && (
              <>
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-200 text-green-900 font-semibold text-base border border-green-300 relative group" title="Total donations made">
                  <span className="w-2 h-2 mr-2 rounded-full bg-green-400 animate-pulse-slow" />
                  <span className="font-semibold">Total:</span>
                  <span className="ml-1 font-bold tracking-tight text-black">
                    $<CountUp end={totalDonations} duration={2} separator="," decimals={2} />
                  </span>
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Total donations made
                  </span>
                </span>
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-yellow-200 text-yellow-900 font-semibold text-base border border-yellow-300 relative group" title="Your current donation balance">
                  <span className="w-2 h-2 mr-2 rounded-full bg-green-400 animate-pulse-slow" />
                  <span className="font-semibold">Collected:</span>
                  <span className="ml-1 font-bold tracking-tight text-black">$4.56</span>
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Your current donation balance
                  </span>
                </span>
              </>
            )}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 text-base transition-all duration-200 hover:bg-yellow-300 hover:text-black focus:text-black focus:bg-yellow-300 font-semibold text-white bg-black rounded-full hover:scale-105 active:scale-95 transform"
                title="Sign out of your account"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => nav('/signup')}
                className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 text-base transition-all duration-200 hover:bg-yellow-300 hover:text-black focus:text-black focus:bg-yellow-300 font-semibold text-white bg-black rounded-full hover:scale-105 active:scale-95 transform"
                title="Create an account or sign in"
              >
                Join Now
              </button>
            )}
          </div>
        </div>
        {/* Mobile menu */}
        <div className={`lg:hidden ${menuOpen ? 'block' : 'hidden'} transition-all duration-300 ease-in-out`} id="mobile-menu">
          <nav className="flex flex-col items-center space-y-4 py-6 bg-white shadow-lg rounded-b-2xl mx-4" aria-label="Mobile navigation">
            {pages.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={e => { guard(e, to); setMenuOpen(false); }}
                className={({ isActive }) =>
                  `text-base text-black transition-all duration-200 hover:text-opacity-80 px-4 py-2 rounded-lg w-full text-center ${isActive ? 'font-bold bg-yellow-100 text-yellow-800' : 'hover:bg-gray-50'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="w-full border-t border-gray-200 pt-4 mt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full items-center justify-center px-5 py-3 text-base transition-all duration-200 hover:bg-yellow-300 hover:text-black focus:text-black focus:bg-yellow-300 font-semibold text-white bg-black rounded-full hover:scale-105 active:scale-95 transform"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => { nav('/signup'); setMenuOpen(false); }}
                  className="w-full items-center justify-center px-5 py-3 text-base transition-all duration-200 hover:bg-yellow-300 hover:text-black focus:text-black focus:bg-yellow-300 font-semibold text-white bg-black rounded-full hover:scale-105 active:scale-95 transform"
                >
                  Join Now
                </button>
              )}
            </div>
          </nav>
        </div>
    </header>
  );
}
