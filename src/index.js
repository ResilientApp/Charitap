import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';
import App from './App';

// Check if Auth0 environment variables are configured
const auth0Domain = process.env.REACT_APP_AUTH0_DOMAIN;
const auth0ClientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

if (!auth0Domain || !auth0ClientId) {
  console.error('Auth0 configuration missing. Please check your .env file.');
  console.error('Required variables: REACT_APP_AUTH0_DOMAIN, REACT_APP_AUTH0_CLIENT_ID');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={auth0Domain || 'placeholder.auth0.com'}
      clientId={auth0ClientId || 'placeholder-client-id'}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: process.env.REACT_APP_AUTH0_SCOPE || 'openid profile email'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Auth0Provider>
  </React.StrictMode>
);
