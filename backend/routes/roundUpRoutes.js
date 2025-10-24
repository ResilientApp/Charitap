// routes/roundUp.js
const express = require('express');
const router = express.Router();
const RoundUp = require('../models/RoundUp');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');

// API to create a new RoundUp entry
router.post('/create-roundup', authenticateToken, async (req, res) => {
  try {
    const { purchaseAmount, roundUpAmount } = req.body;
    
    // Validate input data
    if (!purchaseAmount || !roundUpAmount) {
      return res.status(400).json({ error: 'Purchase amount and roundup amount are required' });
    }
    
    // Create a new RoundUp entry with isPaid set to false by default
    // Use authenticated user's email
    const newRoundUp = new RoundUp({
      user: req.user.email,
      purchaseAmount,
      roundUpAmount,
      isPaid: false,
    });
    
    await newRoundUp.save();
    
    // Return the created RoundUp entry in the response
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
    const transactions = await Transaction.find({ userEmail: req.user.email });
    
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
    const { limit = 100, offset = 0, startDate, endDate } = req.query;
    
    const query = { user: req.user.email };
    
    // Optional date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const roundups = await RoundUp.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalCount = await RoundUp.countDocuments(query);
    
    // Format the response
    const formattedRoundups = roundups.map(roundup => ({
      id: roundup._id,
      purchaseAmount: parseFloat(roundup.purchaseAmount.toFixed(2)),
      roundUpAmount: parseFloat(roundup.roundUpAmount.toFixed(2)),
      date: roundup.createdAt,
      isPaid: roundup.isPaid,
      status: roundup.isPaid ? 'Donated' : 'Pending'
    }));
    
    res.json({
      data: formattedRoundups,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + parseInt(limit)
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
    const { limit = 100, offset = 0, startDate, endDate } = req.query;
    
    const query = { userEmail: req.user.email };
    
    // Optional date filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .populate('charity', 'name type description')
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);
    
    // Format the response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      amount: parseFloat(transaction.amount.toFixed(2)),
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
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + parseInt(limit)
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
    const transactions = await Transaction.find({ userEmail: req.user.email }).distinct('charity');
    
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
    const userCreatedAt = req.user.createdAt || new Date(0);
    
    // Calculate how many months since user creation (max 12)
    const monthsSinceCreation = Math.min(
      12,
      Math.floor((now - userCreatedAt) / (1000 * 60 * 60 * 24 * 30)) + 1
    );
    
    // Get date 12 months ago (or user creation date if more recent)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    
    const startDate = userCreatedAt > twelveMonthsAgo ? userCreatedAt : twelveMonthsAgo;
    
    // Fetch all transactions since start date
    const transactions = await Transaction.find({
      userEmail: req.user.email,
      timestamp: { $gte: startDate }
    }).lean();
    
    // Group transactions by month
    const monthlyData = {};
    
    // Initialize all months with 0
    for (let i = 0; i < monthsSinceCreation; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: 0,
        transactionCount: 0,
        year: date.getFullYear(),
        monthNumber: date.getMonth() + 1
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
    
    // Convert to array and sort by date (oldest to newest)
    const monthlyArray = Object.keys(monthlyData)
      .sort()
      .map(key => ({
        ...monthlyData[key],
        amount: parseFloat(monthlyData[key].amount.toFixed(2))
      }));
    
    res.json({
      monthlyDonations: monthlyArray.reverse(), // Most recent first
      totalMonths: monthsSinceCreation,
      summary: {
        totalDonated: monthlyArray.reduce((sum, month) => sum + month.amount, 0).toFixed(2),
        averagePerMonth: (monthlyArray.reduce((sum, month) => sum + month.amount, 0) / monthsSinceCreation).toFixed(2),
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
    const transactions = await Transaction.find({ userEmail: req.user.email })
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

module.exports = router;