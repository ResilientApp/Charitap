// routes/roundUp.js
const express = require('express');
const router = express.Router();
const RoundUp = require('../models/RoundUp');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');
const resilientDB = require('../services/resilientdb-client');
const donationValidator = require('../services/donation-validator');

// API to create a new RoundUp entry
router.post('/create-roundup', authenticateToken, async (req, res) => {
  try {
    const { purchaseAmount, roundUpAmount } = req.body;

    // Validate input data and coerce to numbers
    const parsedPurchase = parseFloat(purchaseAmount);
    const parsedRoundUp = parseFloat(roundUpAmount);

    if (isNaN(parsedPurchase) || isNaN(parsedRoundUp) || parsedPurchase <= 0 || parsedRoundUp <= 0) {
      return res.status(400).json({ error: 'Valid purchase amount and roundup amount are required' });
    }

    // Create a new RoundUp entry with isPaid set to false by default
    // Use authenticated user's email
    const newRoundUp = new RoundUp({
      user: req.user.email,
      purchaseAmount: parsedPurchase,
      roundUpAmount: parsedRoundUp,
      isPaid: false,
    });

    await newRoundUp.save();

    // HYBRID APPROACH: KV Ledger + Backend Validation (non-blocking)
    const blockchainPromise = (async () => {
      try {
        // Get user's selected charities for validation
        const User = require('../models/User');
        const user = await User.findOne({ email: req.user.email });

        // Prepare donation data for validation
        const donationData = {
          amount: roundUpAmount,
          charities: user?.selectedCharities || []
        };

        // VALIDATE before writing to blockchain
        const validationResult = donationValidator.validateDonation(donationData);

        // Write to KV Ledger with validation proof
        const ledgerKey = resilientDB.generateKey('donation', newRoundUp._id.toString());
        const ledgerData = {
          transactionId: newRoundUp._id.toString(),
          userId: resilientDB.hashSensitiveData(req.user.email),
          purchaseAmount: parseFloat(purchaseAmount).toFixed(2),
          roundUpAmount: parseFloat(roundUpAmount).toFixed(2),
          timestamp: newRoundUp.createdAt.toISOString(),
          status: 'pending',
          // NEW: Validation proof
          validated: validationResult.valid,
          validationRules: validationResult.appliedRules,
          charityCount: donationData.charities.length,
          blockchainVersion: '2.0' // Hybrid with validation
        };

        const txId = await resilientDB.set(ledgerKey, ledgerData);

        if (txId) {
          // Update MongoDB with blockchain reference
          newRoundUp.blockchainTxKey = ledgerKey;
          newRoundUp.blockchainTxId = txId;
          newRoundUp.blockchainVerified = true;
          newRoundUp.blockchainTimestamp = new Date();
          await newRoundUp.save();

          console.log(`[Charitap] OK Validated & recorded on blockchain: ${txId}`);
          console.log(`[Charitap] Validation: ${validationResult.appliedRules.join(', ')}`);
        }

      } catch (blockchainError) {
        console.error('[Charitap] WARNING  Blockchain write failed (non-critical):', blockchainError.message);
        // Store error for debugging
        try {
          newRoundUp.blockchainError = blockchainError.message;
          await newRoundUp.save();
        } catch (saveError) {
          console.error('[Charitap] WARNING Failed to save blockchain error:', saveError.message);
        }
      }
    })();

    // Don't wait for blockchain - return response immediately
    res.status(201).json(newRoundUp);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while creating the roundup' });
  }
});

// Get user's roundup history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const roundups = await RoundUp.find({ user: req.user.email })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ roundups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching roundup history' });
  }
});

// Get user's pending (unpaid) roundups total
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const unpaidRoundUps = await RoundUp.find({
      user: req.user.email,
      isPaid: false
    });

    const totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

    res.json({
      count: unpaidRoundUps.length,
      totalAmount: totalAmount.toFixed(2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching pending roundups' });
  }
});

// Get total amount donated by user till date
// Returns sum of all processed transactions (doesn't include pending roundups)
router.get('/total-donated', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id.toString() });

    const totalDonated = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    res.json({
      totalDonated: totalDonated.toFixed(2),
      transactionCount: transactions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching total donated amount' });
  }
});

// Get collected amount for this month (unpaid roundups from current month)
// Shows this month's accumulated roundups that haven't been triggered yet
router.get('/collected-this-month', authenticateToken, async (req, res) => {
  try {
    // Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Find unpaid roundups from this month
    const unpaidRoundUpsThisMonth = await RoundUp.find({
      user: req.user.email,
      isPaid: false,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const collectedAmount = unpaidRoundUpsThisMonth.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

    res.json({
      collectedThisMonth: collectedAmount.toFixed(2),
      count: unpaidRoundUpsThisMonth.length,
      month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching collected amount for this month' });
  }
});

// Get activity - collected tab (all roundups with details)
// Shows each order/purchase with roundup amount and date
router.get('/activity/collected', authenticateToken, async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const rawOffset = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 100;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
    const { startDate, endDate } = req.query;

    const query = { user: req.user.email };

    // Optional date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const roundups = await RoundUp.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalCount = await RoundUp.countDocuments(query);

    // Format the response
    const formattedRoundups = roundups.map(roundup => ({
      id: roundup._id,
      purchaseAmount: parseFloat((roundup.purchaseAmount || 0).toFixed(2)),
      roundUpAmount: parseFloat((roundup.roundUpAmount || 0).toFixed(2)),
      date: roundup.createdAt,
      isPaid: roundup.isPaid,
      status: roundup.isPaid ? 'Donated' : 'Pending'
    }));

    res.json({
      data: formattedRoundups,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching collected activity' });
  }
});

// Get activity - donated tab (all transactions with charity details)
// Shows each donation with amount, charity name, type, and date
router.get('/activity/donated', authenticateToken, async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const rawOffset = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 100;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
    const { startDate, endDate } = req.query;

    const query = { userId: req.user._id.toString() };

    // Optional date filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('charity', 'name type description')
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalCount = await Transaction.countDocuments(query);

    // Null-safe: skip transactions whose charity reference was deleted
    const formattedTransactions = transactions
      .filter(t => t.charity)
      .map(transaction => ({
        id: transaction._id,
        amount: parseFloat((transaction.amount || 0).toFixed(2)),
        date: transaction.timestamp,
        charity: {
          id: transaction.charity._id,
          name: transaction.charity.name,
          type: transaction.charity.type,
          description: transaction.charity.description
        },
        stripeTransactionId: transaction.stripeTransactionId
      }));

    res.json({
      data: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching donated activity' });
  }
});

// Dashboard: Get unique charities count that user has donated to
router.get('/dashboard/unique-charities', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id.toString() }).distinct('charity');

    const uniqueCharitiesCount = transactions.length;

    res.json({
      uniqueCharities: uniqueCharitiesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching unique charities count' });
  }
});

// Dashboard: Get monthly donation breakdown for last 12 months
// Returns data only for months since user account creation if < 12 months old
router.get('/dashboard/monthly-donations', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0 = January)

    // YTD: Start from January 1st of current year
    const startDate = new Date(currentYear, 0, 1); // January 1st of current year
    startDate.setHours(0, 0, 0, 0);

    // Fetch all transactions for current year only
    const transactions = await Transaction.find({
      userId: req.user._id.toString(),
      timestamp: { $gte: startDate, $lte: now }
    }).lean();

    // Group transactions by month - only for current year YTD
    const monthlyData = {};

    // Initialize all months from January to current month with 0
    for (let i = 0; i <= currentMonth; i++) {
      const date = new Date(currentYear, i, 1);
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short' }), // Just month name (e.g., "Jan")
        amount: 0,
        transactionCount: 0,
        year: currentYear,
        monthNumber: i + 1
      };
    }

    // Aggregate transaction amounts by month
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].amount += transaction.amount;
        monthlyData[monthKey].transactionCount += 1;
      }
    });

    // Convert to array and sort by month (January to current month)
    const monthlyArray = Object.keys(monthlyData)
      .sort()
      .map(key => ({
        ...monthlyData[key],
        amount: parseFloat(monthlyData[key].amount.toFixed(2))
      }));

    res.json({
      monthlyDonations: monthlyArray, // Chronological order (Jan to current)
      totalMonths: currentMonth + 1, // Number of months YTD
      summary: {
        totalDonated: monthlyArray.reduce((sum, month) => sum + month.amount, 0).toFixed(2),
        averagePerMonth: (monthlyArray.reduce((sum, month) => sum + month.amount, 0) / (currentMonth + 1)).toFixed(2),
        totalTransactions: monthlyArray.reduce((sum, month) => sum + month.transactionCount, 0)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching monthly donation data' });
  }
});

// Dashboard: Get charity donation breakdown for pie chart
// Returns percentage and amount breakdown by charity
router.get('/dashboard/charity-breakdown', authenticateToken, async (req, res) => {
  try {
    // Fetch all user transactions with charity details
    const transactions = await Transaction.find({ userId: req.user._id.toString() })
      .populate('charity', 'name type description')
      .lean();

    if (transactions.length === 0) {
      return res.json({
        charities: [],
        totalDonated: 0,
        message: 'No donations yet'
      });
    }

    // Group by charity and calculate totals
    const charityMap = {};
    let totalAmount = 0;

    transactions.forEach(transaction => {
      // Skip transactions whose charity reference was deleted
      if (!transaction.charity || !transaction.charity._id) return;
      const charityId = transaction.charity._id.toString();
      totalAmount += transaction.amount;

      if (!charityMap[charityId]) {
        charityMap[charityId] = {
          id: charityId,
          name: transaction.charity.name,
          type: transaction.charity.type,
          description: transaction.charity.description,
          amount: 0,
          donationCount: 0
        };
      }

      charityMap[charityId].amount += transaction.amount;
      charityMap[charityId].donationCount += 1;
    });

    // Convert to array and calculate percentages
    const charitiesArray = Object.values(charityMap).map(charity => ({
      id: charity.id,
      name: charity.name,
      type: charity.type,
      description: charity.description,
      amount: parseFloat(charity.amount.toFixed(2)),
      percentage: parseFloat(((charity.amount / totalAmount) * 100).toFixed(2)),
      donationCount: charity.donationCount
    }));

    // Sort by amount (highest first)
    charitiesArray.sort((a, b) => b.amount - a.amount);

    res.json({
      charities: charitiesArray,
      totalDonated: parseFloat(totalAmount.toFixed(2)),
      charityCount: charitiesArray.length,
      summary: {
        mostSupported: charitiesArray[0]?.name || null,
        mostSupportedAmount: charitiesArray[0]?.amount || 0,
        mostSupportedPercentage: charitiesArray[0]?.percentage || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching charity breakdown data' });
  }
});

// Get blockchain security statistics
// Returns number of transactions recorded on ResilientDB ledger
router.get('/dashboard/blockchain-stats', authenticateToken, async (req, res) => {
  try {
    // Get all transactions for the user
    const transactions = await Transaction.find({ userId: req.user._id.toString() });

    // Count how many have actually been secured on blockchain
    // Only count transactions that have a blockchainTxId (verified on-chain)
    const totalTransactions = transactions.length;
    const blockchainSecured = transactions.filter(tx => tx.blockchainTxId || tx.blockchainVerified).length;

    res.json({
      totalTransactions,
      blockchainSecured,
      percentage: totalTransactions > 0
        ? parseFloat(((blockchainSecured / totalTransactions) * 100).toFixed(1))
        : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching blockchain stats' });
  }
});

// NEW: Verify a transaction on the blockchain
router.get('/verify-blockchain/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Validate ObjectId format before querying DB
    if (!require('mongoose').Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID format', verified: false });
    }

    // First check if transaction exists in database
    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: req.user._id.toString()
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        verified: false
      });
    }

    // Check if we have blockchain reference
    if (!transaction.blockchainTxId) {
      return res.status(200).json({
        verified: false,
        reason: 'Transaction not yet on blockchain',
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          createdAt: transaction.createdAt
        }
      });
    }

    // Verify on blockchain using GET method
    const isVerified = await resilientDB.verify(transaction.blockchainTxId);

    if (isVerified) {
      // Optionally get full transaction data
      const blockchainData = await resilientDB.get(transaction.blockchainTxId);

      return res.status(200).json({
        verified: true,
        blockchainTxId: transaction.blockchainTxId,
        blockchainTxKey: transaction.blockchainTxKey,
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          blockchainTimestamp: transaction.blockchainTimestamp
        },
        blockchainData: blockchainData
      });
    } else {
      return res.status(200).json({
        verified: false,
        reason: 'Transaction not found on blockchain',
        blockchainTxId: transaction.blockchainTxId,
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          createdAt: transaction.createdAt
        }
      });
    }

  } catch (error) {
    console.error('[Charitap] Blockchain verification error:', error);
    res.status(500).json({
      error: 'Error verifying blockchain transaction',
      details: error.message
    });
  }
});

module.exports = router;