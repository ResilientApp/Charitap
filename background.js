console.log('Service Worker: background.js loaded at', new Date().toISOString());
// Global variables to store the current user data
let currentUserId = null;
let currentUserEmail = null;
let currentUserToken = null;
let currentAuthOrigin = null; // Track where the user logged in from

// API URL selection — localhost when logged in locally, Vercel backend for deployed site
function getApiBaseUrl() {
  if (currentAuthOrigin && currentAuthOrigin.includes('localhost')) {
    return 'http://localhost:3001/api';
  }
  // Deployed Vercel backend
  return 'https://charitap-backend.vercel.app/api';
}

// Initialize the extension by retrieving stored user data
chrome.storage.local.get(['userId', 'userEmail', 'userToken', 'authOrigin'], (result) => {
  if (chrome.runtime.lastError) {
    console.error(`Service Worker: Error retrieving user data from chrome.storage: ${chrome.runtime.lastError.message}`);
  } else {
    currentUserId = result.userId;
    currentUserEmail = result.userEmail;
    currentUserToken = result.userToken;
    currentAuthOrigin = result.authOrigin || null;
    console.log(`Service Worker: Retrieved stored user data - ID: '${currentUserId}', Email: '${currentUserEmail}', Token: ${currentUserToken ? 'Present' : 'Missing'}, Origin: '${currentAuthOrigin}'`);
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
   
  if (message.type === "SAVE_USER_DATA") {
    const receivedEmail = message.email;
    const receivedUserId = message.userId;
    const receivedToken = message.token;
    
    console.log(`Service Worker: Received user data from ${sender.origin} - Email: '${receivedEmail}', UserID: '${receivedUserId}', Token: ${receivedToken ? 'Present' : 'Missing'}`);

    // Update current user data
    currentUserId = receivedUserId;
    currentUserEmail = receivedEmail;
    currentUserToken = receivedToken;
    currentAuthOrigin = sender.origin; // Track login origin for API URL selection

    // Store user data
    chrome.storage.local.set({ 
      userId: receivedUserId, 
      userEmail: receivedEmail, 
      userToken: receivedToken,
      authOrigin: sender.origin
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Service Worker: Error saving user data to chrome.storage: ${chrome.runtime.lastError.message}`);
        sendResponse({ status: "error", message: "Extension failed to store user data." });
      } else {
        console.log(`Service Worker: User data saved successfully.`);
        sendResponse({ status: "success", message: "User data received and stored by extension." });
      }
    });
  } else {
    // Handle legacy message format for backward compatibility
    const receivedUserId = message.email;
    console.log(`Service Worker: Received legacy Email '${receivedUserId}' from ${sender.origin}`);

    // Update current user ID
    currentUserId = receivedUserId;
    currentUserEmail = receivedUserId;

    // Store User ID
    chrome.storage.local.set({ userId: receivedUserId, userEmail: receivedUserId }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Service Worker: Error saving User ID to chrome.storage: ${chrome.runtime.lastError.message}`);
        sendResponse({ status: "error", message: "Extension failed to store User ID." });
      } else {
        console.log(`Service Worker: Email '${receivedUserId}' saved successfully.`);
        sendResponse({ status: "success", message: "User ID received and stored by extension." });
      }
    });
  }

  // Indicate asynchronous response
  return true;
});

// Listen for internal messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Service Worker: Received internal message:', JSON.stringify(message));
  
  if (message.action === 'createRoundUp') {
    // Extract data from message
    const { userEmail, purchaseAmount, roundUpAmount, merchantName } = message.data;
    
    console.log(`Service Worker: Creating roundup for ${userEmail}, purchase: $${purchaseAmount}, roundup: $${roundUpAmount}, merchant: ${merchantName}`);
    
    // Helper to broadcast wallet update to ALL tabs (including React app on localhost)
    const broadcastWalletUpdate = () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          // Send via content script message (works on non-localhost tabs)
          chrome.tabs.sendMessage(tab.id, { type: 'CHARITAP_WALLET_UPDATE' }).catch(() => {});
          // Also inject postMessage directly so React app on localhost:3000 receives it
          // (contentScript is excluded from localhost:3000, so we inject directly)
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.postMessage({ type: 'CHARITAP_WALLET_UPDATE' }, '*')
          }).catch(() => {});
        });
      });
    };

    // Helper to make the actual fetch call with a given token
    const doFetch = (token) => {
      const API_BASE_URL = getApiBaseUrl();
      console.log(`Service Worker: Using API URL: ${API_BASE_URL}`);

      fetch(`${API_BASE_URL}/roundup/create-roundup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          purchaseAmount: purchaseAmount,
          roundUpAmount: roundUpAmount,
          merchantName: merchantName || 'Unknown Merchant'
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Service Worker: Roundup created successfully:', data);
        broadcastWalletUpdate();
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Service Worker: Error creating roundup:', error);
        sendResponse({ success: false, error: error.message });
      });
    };

    // Fix: if token not yet loaded in memory (service worker just restarted),
    // re-read from storage before giving up
    if (!currentUserToken) {
      console.warn('Service Worker: Token not in memory, reading from storage...');
      chrome.storage.local.get(['userToken', 'authOrigin'], (result) => {
        if (result.userToken) {
          currentUserToken = result.userToken;
          currentAuthOrigin = result.authOrigin || null;
          console.log('Service Worker: Token loaded from storage, proceeding with roundup');
          doFetch(currentUserToken);
        } else {
          console.error('Service Worker: No auth token in storage either');
          sendResponse({ success: false, error: 'Not authenticated - please log in again' });
        }
      });
    } else {
      doFetch(currentUserToken);
    }
    
    // Return true to indicate async response
    return true;
  }
  
  if (message.action === 'walletUpdated') {
    console.log('Service Worker: Wallet updated, broadcasting to tabs');
    
    // Broadcast to all tabs including the website
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        // Send to content scripts
        chrome.tabs.sendMessage(tab.id, {
          type: 'CHARITAP_WALLET_UPDATE'
        }).catch(() => {});
        
        // Also try to send to the page directly via postMessage
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            window.postMessage({ type: 'CHARITAP_WALLET_UPDATE' }, '*');
          }
        }).catch(() => {});
      });
    });
    
    sendResponse({ success: true });
    return true;
  }
});
  