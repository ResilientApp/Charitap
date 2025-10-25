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
  