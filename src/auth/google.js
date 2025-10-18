// src/auth/google.js
/* global google */

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

function base64UrlDecode(str) {
  // Replace non-url compatible chars with base64 standard chars
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with trailing '='s
  const pad = str.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('InvalidLengthError: Incorrect padding');
    }
    str += new Array(5 - pad).join('=');
  }
  // atob can handle base64 std encoding
  const decoded = atob(str);
  try {
    // decodeURIComponent for utf8
    return decodeURIComponent(
      decoded
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (_) {
    return decoded;
  }
}

function decodeJwt(idToken) {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid ID token');
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return payload;
}

export async function signInWithGoogleGSI() {
  await loadGoogleScript();
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Missing REACT_APP_GOOGLE_CLIENT_ID in environment');
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) reject(new Error('Google sign-in timed out'));
    }, 60000);

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          try {
            const payload = decodeJwt(response.credential);
            resolved = true;
            clearTimeout(timeout);
            resolve({
              id: payload.sub,
              email: payload.email,
              firstName: payload.given_name || '',
              lastName: payload.family_name || '',
              fullName: payload.name || '',
              picture: payload.picture || ''
            });
          } catch (e) {
            clearTimeout(timeout);
            reject(e);
          }
        },
        ux_mode: 'popup'
      });
      // Prompt One Tap / popup selection UI
      google.accounts.id.prompt((notification) => {
        // If dismissed, still keep waiting for callback within timeout
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If not displayed (e.g., blocked), try to render a moment again after a short delay
          setTimeout(() => google.accounts.id.prompt(), 500);
        }
      });
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
}


