// (Empty for now—could be used for analytics, version checks, etc.)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
   
  const receivedUserId = message.userId;
  console.log(`Service Worker: Received User ID '${receivedUserId}' from ${sender.origin}`);

  // 3. Store User ID
  chrome.storage.local.set({ userId: receivedUserId }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Service Worker: Error saving User ID to chrome.storage: ${chrome.runtime.lastError.message}`);
      sendResponse({ status: "error", message: "Extension failed to store User ID." });
    } else {
      console.log(`Service Worker: User ID '${receivedUserId}' saved successfully.`);
      sendResponse({ status: "success", message: "User ID received and stored by extension." });
    }
  });

// 4. Indicate asynchronous response
return true;
});
  