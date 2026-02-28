const express = require('express');
const router = express.Router();
const Charity = require('../models/Charity');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get all charities (public or authenticated)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const charities = await Charity.find()
      .select('name type description createdAt')
      .sort({ name: 1 })
      .lean();

    res.json({
      charities,
      count: charities.length
    });
  } catch (error) {
    console.error('Get charities error:', error);
    res.status(500).json({ error: 'Error fetching charities' });
  }
});

// Get single charity by ID
router.get('/:id', async (req, res) => {
  try {
    if (!require('mongoose').Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid charity ID format' });
    }

    const charity = await Charity.findById(req.params.id)
      .select('name type description createdAt')
      .lean();

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    res.json({ charity });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid charity ID' });
    }
    console.error('Get charity error:', error);
    res.status(500).json({ error: 'Error fetching charity' });
  }
});

module.exports = router;

