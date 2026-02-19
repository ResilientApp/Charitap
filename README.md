# Charitap: Seamless Micro-Donations Platform

## 📖 Introduction
**Charitap** is a modern web application designed to revolutionize the way people donate to charity. By integrating seamless "round-up" logic into everyday transactions, Charitap allows users to contribute small amounts effortlessly, which accumulate to make a significant impact over time.

### 🚀 Motivation
In today's fast-paced world, many individuals wish to support charitable causes but often face meaningful friction:
1.  **Decision Fatigue**: Choosing where and how much to donate can be overwhelming.
2.  **Lack of Transparency**: Donors often wonder if their money actually reaches the intended cause.
3.  **Process Friction**: Setting up recurring payments or making one-off donations takes time and effort.

### ❓ Problem Statement
Traditional donation models rely on users consciously deciding to part with a significant sum of money at a specific moment in time. This creates a psychological barrier. Furthermore, the lack of immutable records in charitable transactions can lead to trust issues between donors and organizations.

### 💡 Solution
Charitap solves these problems by:
*   **Micro-Donations**: Rounding up everyday purchases (e.g., a coffee for $4.50 becomes $5.00, with $0.50 going to charity).
*   **Automation**: Once set up, the process is entirely hands-off.
*   **Transparency**: Leveraging **ResilientDB** (blockchain) to create an immutable, verifiable ledger of every donation receipt.
*   **Flexibility**: Users can choose between "Threshold" based payments (donate when roundups hit $5) or "Monthly" settlements.

---

## ✨ Key Features

### 1. Automated Round-Ups
Charitap links with your daily transactions. When you spend $12.40, the app calculates a $0.60 "round-up". These small amounts are tracked and accumulated until they reach your set threshold.

### 2. Flexible Payment Preferences
*   **Threshold Mode**: Donations are processed immediately once your accumulated round-ups reach $5.00.
*   **Monthly Mode**: Accumulated round-ups are processed once a month, regardless of the total (minimum $1.00).

### 3. Blockchain Verification
Every donation is verified. A cryptographic hash of the transaction is stored on **ResilientDB**. Users can click "Verify" on any past donation to check its existence and integrity on the blockchain ledger.

### 4. Charity Nomination
Don't see your favorite charity? Users can nominate new charities directly through the app. Admins receive an email notification to review and approve new organizations.

### 5. Interactive Dashboard
*   **Impact Visualization**: View your donation history through interactive charts.
*   **Charity Breakdown**: See exactly where your money went, split by charity.
*   **Blockchain Stats**: Real-time stats on how many of your transactions are secured on-chain.

---

## 🏗️ Technical Architecture

Charitap employs a robust, microservices-inspired architecture to ensure scalability, security, and transparency.

### 1. Frontend (Client)
*   **Framework**: React.js (Create React App)
*   **Styling**: Tailwind CSS for a modern, responsive design.
*   **Key Components**:
    *   `Dashboard.js`: Central hub for user activity.
    *   `Settings.js`: Configuration for payment preferences and account details.
    *   `NominateCharity.js`: User engagement feature to suggest new causes.

### 2. Backend (Server)
*   **Runtime**: Node.js & Express.js
*   **Task Scheduling**: `node-cron` handles background jobs to process accumulated round-ups daily at midnight.
*   **Payments**: **Stripe Connect** manages secure card charges/transfers. The platform acts as a platform, transferring funds from donors to connected charity accounts.

### 3. Database & Storage
*   **MongoDB**: Primary data store.
*   **Redis**: Used for caching and performance.
*   **ResilientDB**: Distributed ledger for immutable transaction records.

---

## 🔌 API Documentation

### Authentication (`/api/auth`)
*   `POST /signup`: Register a new user with email/password.
*   `POST /login`: Authenticate existing user.
*   `POST /google`: OAuth login/signup with Google.
*   `GET /me`: Retrieve current user profile.

### Round-Ups & Donations (`/api/roundup`)
*   `POST /create-roundup`: Record a new purchase and calculate round-up amount.
*   `GET /history`: Fetch user's round-up history.
*   `GET /pending`: Get total unpaid round-ups.
*   `GET /dashboard/monthly-donations`: Get data for monthly donation charts.

### Payments (`/api/stripe`)
*   `POST /create-customer`: Initialize Stripe customer for user.
*   `POST /save-payment-method`: Securely save a card for future recurring charges.
*   `POST /list-payment-methods`: Retrieve user's saved cards.

### Charity (`/api/charity-nominations`)
*   `POST /nominate`: Submit a new charity for platform consideration.
*   `GET /my-nominations`: View status of your submitted nominations.

---

## 🗄️ Database Schema

### User Model (`User.js`)
Stores user identity and preferences.
*   `email`: User's unique email.
*   `authProvider`: 'local' or 'google'.
*   `stripeCustomerId`: Link to Stripe.
*   `paymentPreference`: 'threshold' or 'monthly'.
*   `selectedCharities`: Array of references to supported Charity IDs.

### Transaction Model (`Transaction.js`)
Records completed donations.
*   `userEmail`: Link to donor.
*   `amount`: Total amount donated in this transaction.
*   `charity`: Reference to the recipient Charity.
*   `stripePaymentIntentId`: ID of the charge on Stripe.
*   `blockchainTxId`: ID of the immutable record on ResilientDB.
*   `blockchainVerified`: Boolean flag confirming on-chain verification.

---

## 🛠️ Tech Stack Overview

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | React, Tailwind CSS | UI/UX , Responsive Design |
| **Backend** | Node.js, Express | RESTful API, Business Logic |
| **Database** | MongoDB, Mongoose | Persistent Data Storage |
| **Blockchain** | ResilientDB, Solidity | Immutable Donation Receipts |
| **Payments** | Stripe Connect | Payment Processing & Payouts |
| **DevOps** | Docker, Shell Scripts | Containerization & Deployment |

---

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js (v16+)
*   MongoDB (Local or Atlas)
*   ResilientDB instance (Local or Remote)
*   Stripe Account (Test mode keys)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    ```

2.  **Install Frontend Dependencies**
    ```bash
    cd src
    npm install
    ```

3.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

4.  **Environment Setup**
    *   Create a `.env` file in the `backend` directory.
    *   Add necessary keys: `MONGODB_URI`, `STRIPE_SECRET_KEY`, `RESILIENTDB_URL`, etc.

5.  **Run the Application**
    *   **Backend**: `cd backend && npm run dev`
    *   **Frontend**: `npm start` (from root)
