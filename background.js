// Global variable to store the current user ID
let currentUserId = null;

// Initialize the extension by retrieving stored user ID
chrome.storage.local.get(['userId'], (result) => {
  if (chrome.runtime.lastError) {
    console.error(`Service Worker: Error retrieving User ID from chrome.storage: ${chrome.runtime.lastError.message}`);
  } else if (result.userId) {
    currentUserId = result.userId;
    console.log(`Service Worker: Retrieved stored User ID '${currentUserId}'`);
  } else {
    console.log(`Service Worker: No stored User ID found`);
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
   
  const receivedUserId = message.userId;
  console.log(`Service Worker: Received User ID '${receivedUserId}' from ${sender.origin}`);

  // Update current user ID
  currentUserId = receivedUserId;

  // Store User ID
  chrome.storage.local.set({ userId: receivedUserId }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Service Worker: Error saving User ID to chrome.storage: ${chrome.runtime.lastError.message}`);
      sendResponse({ status: "error", message: "Extension failed to store User ID." });
    } else {
      console.log(`Service Worker: User ID '${receivedUserId}' saved successfully.`);
      sendResponse({ status: "success", message: "User ID received and stored by extension." });
    }
  });

// Indicate asynchronous response
return true;
});
  