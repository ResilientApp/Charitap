const express = require('express');
const router = express.Router();
const Charity = require('../models/Charity');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Get all charities (public or authenticated) - with caching
router.get('/', optionalAuth, cacheMiddleware('charity', 600), async (req, res) => {
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

// Get single charity by ID - with caching
router.get('/:id', cacheMiddleware('charity', 600, (req) => `charity:${req.params.id}`), async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id)
      .select('name type description createdAt')
      .lean();

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    res.json({ charity });
  } catch (error) {
    console.error('Get charity error:', error);
    res.status(500).json({ error: 'Error fetching charity' });
  }
});

module.exports = router;

