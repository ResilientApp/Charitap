import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'react-toastify';

const pages = [
  { to: '/activity',  label: 'Activity' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/settings',  label: 'Settings' },
];

export default function Navigation() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const nav = useNavigate();

  const guard = (e, to) => {
    if (!isLoading && !isAuthenticated) {
      e.preventDefault();
      toast.info('Please log in first.');
      nav('/');
    }
  };

  return (
    <nav className="fade-in mt-4 flex items-center justify-between bg-white/30 backdrop-blur-md rounded-t-2xl rounded-b-2xl px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <NavLink to="/">
          <img src="/logo.png" alt="Charitap" className="h-8 w-8 rounded-full" />
        </NavLink>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? 'px-3 py-2 bg-[#F5ECD5]/50 text-[#626F47] rounded-md underline'
              : 'px-3 py-2 text-[#F5ECD5] hover:bg-[#F5ECD5]/30 rounded-md'
          }
        >
          Home
        </NavLink>
        {pages.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={e => guard(e, to)}
            className={({ isActive }) =>
              isActive
                ? 'px-3 py-2 bg-[#F5ECD5]/50 text-[#626F47] rounded-md underline'
                : 'px-3 py-2 text-[#F5ECD5] hover:bg-[#F5ECD5]/30 rounded-md'
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center space-x-4">
        {!isLoading && isAuthenticated && (
          <span className="px-3 py-1 rounded-full bg-[#626F47] text-[#F5ECD5] font-semibold">
            Collected: $4.56
          </span>
        )}
        {isAuthenticated ? (
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="btn-primary"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => loginWithRedirect()}
            className="btn-primary"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
