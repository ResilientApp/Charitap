// routes/roundUp.js
const express = require('express');
const router = express.Router();
const RoundUp = require('../models/RoundUp');

// API to create a new RoundUp entry
router.post('/create-roundup', async (req, res) => {
  console.log(req.body);
  try {
    const { user, purchaseAmount, roundUpAmount } = req.body;
    
    // Validate input data
    if (!user || !purchaseAmount || !roundUpAmount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Create a new RoundUp entry with isPaid set to false by default
    const newRoundUp = new RoundUp({
      user,
      purchaseAmount,
      roundUpAmount,
      isPaid: false,
    });
    
    // Save the RoundUp entry to MongoDB
    await newRoundUp.save();
    
    // Return the created RoundUp entry in the response
    res.status(201).json(newRoundUp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while creating the roundup' });
  }
});

module.exports = router;