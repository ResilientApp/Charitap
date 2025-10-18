// src/auth/google.js
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// For backward compatibility, we'll keep the old function but make it use the new implementation
export async function signInWithGoogleGSI() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_google_client_id_here';
  
  if (clientId === 'your_google_client_id_here') {
    throw new Error('Please set up your Google Client ID in the environment variables. Add REACT_APP_GOOGLE_CLIENT_ID to your .env file.');
  }

  return new Promise((resolve, reject) => {
    // Create a temporary Google Login button and trigger it
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    const handleSuccess = (credentialResponse) => {
      try {
        const decoded = jwtDecode(credentialResponse.credential);
        resolve({
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.given_name || '',
          lastName: decoded.family_name || '',
          fullName: decoded.name || '',
          picture: decoded.picture || ''
        });
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(tempDiv);
      }
    };

    const handleError = () => {
      reject(new Error('Google sign-in failed'));
      document.body.removeChild(tempDiv);
    };

    // We'll use a different approach - create a popup window
    const popup = window.open(
      `https://accounts.google.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(window.location.origin)}&state=google_signin`,
      'google_signin',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    // Listen for the popup to close or receive a message
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Google sign-in was cancelled'));
      }
    }, 1000);

    // Listen for messages from the popup
    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_SIGNIN_SUCCESS') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        popup.close();
        handleSuccess({ credential: event.data.credential });
      } else if (event.data.type === 'GOOGLE_SIGNIN_ERROR') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        popup.close();
        handleError();
      }
    };

    window.addEventListener('message', messageHandler);
  });
}

// Export the components for use in the app
export { GoogleOAuthProvider, GoogleLogin };


