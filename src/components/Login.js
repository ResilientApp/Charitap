import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/main.css';

const Login = () => {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    user,
    isLoading
  } = useAuth0();

  if (isLoading) {
    return <div className="login-container">Loading…</div>;
  }

  return (
    <div className="login-container">
      {!isAuthenticated ? (
        <>
          <h2>Welcome to RoundUp for Charity</h2>
          <button onClick={() => loginWithRedirect()}>
            Log In
          </button>
          <button
            onClick={() =>
              loginWithRedirect({
                authorizationParams: { screen_hint: 'signup' }
              })
            }
          >
            Sign Up
          </button>
        </>
      ) : (
        <>
          <h2>Hello, {user.name}</h2>
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Log Out
          </button>
        </>
      )}
    </div>
  );
};

export default Login;