// (Empty for now—could be used for analytics, version checks, etc.)
chrome.runtime.onInstalled.addListener(() => {
    if (!chrome.storage.local.get({ userId: null })){
      console.log("Setting user id");
      // Open login page
      chrome.storage.local.set({userId : "adwivedi@arizona.edu"});
    }
    console.log("Round-Up Charity installed");
  });
  