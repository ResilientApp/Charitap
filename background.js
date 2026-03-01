// Global variables to store the current user data
let currentUserId = null;
let currentUserEmail = null;
let currentUserToken = null;

// Initialize the extension by retrieving stored user data
chrome.storage.local.get(['userId', 'userEmail', 'userToken'], (result) => {
  if (chrome.runtime.lastError) {
    console.error(`Service Worker: Error retrieving user data from chrome.storage: ${chrome.runtime.lastError.message}`);
  } else {
    currentUserId = result.userId;
    currentUserEmail = result.userEmail;
    currentUserToken = result.userToken;
    console.log(`Service Worker: Retrieved stored user data - ID: '${currentUserId}', Email: '${currentUserEmail}', Token: ${currentUserToken ? 'Present' : 'Missing'}`);
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

    // Store user data
    chrome.storage.local.set({ 
      userId: receivedUserId, 
      userEmail: receivedEmail, 
      userToken: receivedToken 
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
  console.log('Service Worker: Received internal message:', message);
  
  if (message.action === 'createRoundUp') {
    // Extract data from message
    const { userEmail, amount, merchantName } = message.data;
    
    console.log(`Service Worker: Creating roundup for ${userEmail}, amount: $${amount}`);
    
    // Check if we have a token
    if (!currentUserToken) {
      console.error('Service Worker: No auth token available');
      sendResponse({ success: false, error: 'Not authenticated' });
      return true;
    }
    
    // Call backend API to create roundup
    const API_BASE_URL = 'https://charitap-wheat.vercel.app/api';
    
    fetch(`${API_BASE_URL}/roundup/create-roundup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUserToken}`
      },
      body: JSON.stringify({
        purchaseAmount: amount,
        roundUpAmount: amount,
        merchantName: merchantName || 'Unknown Merchant'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Service Worker: Roundup created successfully:', data);
      
      // Broadcast wallet update to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CHARITAP_WALLET_UPDATE'
          }).catch(() => {}); // Ignore errors for tabs that don't have content script
        });
      });
      
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error('Service Worker: Error creating roundup:', error);
      sendResponse({ success: false, error: error.message });
    });
    
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
  