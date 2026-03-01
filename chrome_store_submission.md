# Charitap Chrome Web Store Submission Guide

## 1. Single Purpose Description
**Single Purpose:** 
Charitap is a browser extension that makes micro-donations easy by securely detecting e-commerce checkouts, rounding up your purchase total, and donating the spare change to charity.

## 2. Detailed Description

Charitap makes everyday online shopping an opportunity to do good. 

With the Charitap browser extension, you can easily donate your spare change to verified charities whenever you check out at participating e-commerce stores. Our extension seamlessly detects when you are on a checkout page, reads your cart total, and calculates the amount needed to round up to the nearest dollar. 

A non-intrusive widget will appear in the corner of your screen, offering you a one-click option to donate the round-up amount. If you say yes, the donation is securely processed via your Charitap wallet. 

**Features:**
- **Universal Detection:** Automatically detects checkout pages on popular e-commerce platforms.
- **One-Click Donations:** Smooth, interactive widget that calculates the exact round-up amount.
- **Secure & Private:** The extension only reads the cart total on checkout pages. We do not track your browsing history or collect personal payment details.
- **Wallet Sync:** Syncs instantly with your Charitap account and wallet so you can track your philanthropic impact over time.

Make every purchase meaningful with Charitap!

## 3. Contact Information
**Support Email:** dwivedi.aman11@gmail.com

---

## 4. Permission Justifications (For the Developer Dashboard)
You will be asked to justify each permission requested in your `manifest.json`. Copy and paste the following justifications (each is strictly under 1,000 characters):

### storage justification*
This permission is necessary to securely store user authentication state (`userId`, `userEmail`, and `userToken`) in the browser. This ensures that users do not need to repeatedly log into the extension every time they visit a new e-commerce site or restart the browser. Additionally, we use session storage to remember if a user has recently dismissed the donation widget, enabling a 1-hour cooldown period so we do not intrusively spam the user on subsequent pages.

### scripting justification*
This permission is strictly required to dynamically inject the donation widget script (`contentScript.js`) exclusively onto the detected checkout pages of supported e-commerce websites. It allows the extension to briefly read the cart total from the DOM, calculate the necessary round-up donation amount, and securely append our interactive widget UI elements to the page, enabling the user to complete their fast micro-donation without navigating away from checkout.



### Host permission justification*
The host permission `<all_urls>` is required because the extension functions as an intelligent e-commerce checkout detector. It must have the ability to scan and work across a wide variety of unknown e-commerce stores to actively identify a checkout page, capture the cart total securely, and inject the round-up widget dynamically. The specific host `https://charitap.resilientdb.com/*` is required for external messaging to securely sync the user's authentication token and broadcast wallet balance updates between the web application and the extension.
