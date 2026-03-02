const express = require('express');
const router = express.Router();
const Charity = require('../models/Charity');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get all charities (public or authenticated)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const charities = await Charity.find()
      .select('name type description image likes dislikes createdAt')
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
      .select('name type description image likes dislikes createdAt')
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

// Rate charity (thumbs up / thumbs down)
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { action, previousAction } = req.body; // 'like' or 'dislike'

    if (!['like', 'dislike'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be like or dislike' });
    }

    if (!require('mongoose').Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid charity ID format' });
    }

    const incQuery = {};
    if (action === 'like') incQuery.likes = 1;
    if (action === 'dislike') incQuery.dislikes = 1;

    if (previousAction === 'like') incQuery.likes = (incQuery.likes || 0) - 1;
    if (previousAction === 'dislike') incQuery.dislikes = (incQuery.dislikes || 0) - 1;

    // For a real app we might want to track if a user already voted by creating another collection
    // but for simplicity according to the PR specs it updates it directly on Charity model.
    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      { $inc: incQuery },
      { new: true }
    ).select('name type description image likes dislikes createdAt').lean();

    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    res.json({ charity });
  } catch (error) {
    console.error('Rate charity error:', error);
    res.status(500).json({ error: 'Error rating charity' });
  }
});

module.exports = router;

