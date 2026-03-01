const express = require('express');
const router = express.Router();
const CharityApplication = require('../models/CharityApplication');
const Charity = require('../models/Charity');
const { authenticateToken } = require('../middleware/auth');

/**
 * Simple admin authentication middleware
 * TODO: Replace with proper admin role-based auth in production
 */
const isAdmin = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  
  next();
};

/**
 * Get all charity applications
 * GET /api/admin/charity-applications
 * Query params: status (pending, under_review, approved, rejected)
 */
router.get('/charity-applications', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ALLOWED_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
    const status = rawStatus && ALLOWED_STATUSES.includes(rawStatus) ? rawStatus : undefined;

    const rawLimit = Number.parseInt(req.query.limit, 10);
    const rawOffset = Number.parseInt(req.query.offset, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const query = {};
    if (status) query.status = status;

    const applications = await CharityApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const totalCount = await CharityApplication.countDocuments(query);

    res.json({
      applications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get single charity application
 * GET /api/admin/charity-applications/:id
 */
router.get('/charity-applications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const application = await CharityApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ application });
  } catch (error) {
    console.error('[Admin] Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

/**
 * Update charity application (for admin notes, status changes, etc.)
 * PATCH /api/admin/charity-applications/:id
 */
router.patch('/charity-applications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { 
      status, 
      stripeAccountId, 
      adminNotes, 
      contactName, 
      contactPhone,
      ein,
      website,
      description
    } = req.body;
    
    const application = await CharityApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Update fields if provided
    if (status) {
      if (status === 'approved') {
        return res.status(400).json({ error: 'Use the /approve endpoint to approve applications' });
      }
      const ALLOWED_STATUSES = ['pending', 'under_review', 'rejected'];
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided' });
      }
      if (application.status === 'approved' && status === 'rejected') {
        return res.status(400).json({ error: 'Cannot reject an already approved application' });
      }
      application.status = status;
    }
    if (stripeAccountId) {
      application.stripeAccountId = stripeAccountId;
      application.stripeOnboardingComplete = true;
    }
    if (adminNotes !== undefined) application.adminNotes = adminNotes;
    if (contactName) application.contactName = contactName;
    if (contactPhone) application.contactPhone = contactPhone;
    if (ein) application.ein = ein;
    if (website) application.website = website;
    if (description) application.description = description;
    
    // Track reviewer
    if (status === 'under_review' && !application.reviewedAt) {
      application.reviewedAt = new Date();
      application.reviewedBy = req.user.email;
    }
    
    await application.save();
    
    console.log(`[Admin] Updated application ${req.params.id} by ${req.user.email}`);
    
    res.json({
      message: 'Application updated successfully',
      application
    });
  } catch (error) {
    console.error('[Admin] Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * Approve charity application and create charity
 * POST /api/admin/charity-applications/:id/approve
 */
router.post('/charity-applications/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  const session = await require('mongoose').startSession();
  try {
    const { stripeAccountId } = req.body;

    if (!stripeAccountId) {
      return res.status(400).json({
        error: 'Stripe Account ID is required to approve charity'
      });
    }

    let newCharity, application;

    await session.withTransaction(async () => {
      application = await CharityApplication.findById(req.params.id).session(session);

      if (!application) {
        const err = new Error('Application not found'); err.statusCode = 404; throw err;
      }

      if (application.status === 'approved') {
        const err = new Error('Application is already approved'); err.statusCode = 400; throw err;
      }

      // Case-insensitive exact-name lookup via collation (no ReDoS risk)
      const existingCharity = await Charity.findOne({ name: application.charityName })
        .collation({ locale: 'en', strength: 2 })
        .session(session);

      if (existingCharity) {
        const err = new Error('A charity with this name already exists in the system');
        err.statusCode = 400; throw err;
      }

      [newCharity] = await Charity.create([{
        name: application.charityName,
        description: application.description || `Supporting ${application.category} causes`,
        type: application.category,
        stripeAccountId
      }], { session });

      application.status = 'approved';
      application.stripeAccountId = stripeAccountId;
      application.stripeOnboardingComplete = true;
      application.approvedAt = new Date();
      application.reviewedBy = req.user.email;
      application.reviewedAt = new Date();
      await application.save({ session });
    });

    console.log(`[Admin] Approved charity: ${application.charityName} by ${req.user.email}`);

    res.json({
      message: 'Charity approved and added to platform!',
      charity: newCharity,
      application
    });
  } catch (error) {
    const status = error.statusCode || 500;
    const msg = status === 500 ? 'Failed to approve application' : error.message;
    if (status === 500) console.error('[Admin] Error approving application:', error);
    res.status(status).json({ error: msg });
  } finally {
    await session.endSession();
  }
});

/**
 * Reject charity application
 * POST /api/admin/charity-applications/:id/reject
 */
router.post('/charity-applications/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ 
        error: 'Rejection reason is required' 
      });
    }
    
    const application = await CharityApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (application.status === 'approved') {
      return res.status(400).json({ error: 'Cannot reject an already approved application' });
    }
    
    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedBy = req.user.email;
    application.reviewedAt = new Date();
    
    await application.save();
    
    console.log(`[Admin] Rejected charity: ${application.charityName} by ${req.user.email}`);
    
    res.json({
      message: 'Application rejected',
      application
    });
  } catch (error) {
    console.error('[Admin] Error rejecting application:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

/**
 * Delete charity application
 * DELETE /api/admin/charity-applications/:id
 */
router.delete('/charity-applications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Load first so we can check status before deleting
    const application = await CharityApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Block deletion of approved applications to prevent orphaned Charity records
    if (application.status === 'approved') {
      return res.status(409).json({
        error: 'Cannot delete an approved application. The associated charity record must be removed separately.'
      });
    }

    await CharityApplication.findByIdAndDelete(req.params.id);

    console.log(`[Admin] Deleted application: ${application.charityName} by ${req.user.email}`);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('[Admin] Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 */
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [pending, underReview, approved, rejected, totalCharities] = await Promise.all([
      CharityApplication.countDocuments({ status: 'pending' }),
      CharityApplication.countDocuments({ status: 'under_review' }),
      CharityApplication.countDocuments({ status: 'approved' }),
      CharityApplication.countDocuments({ status: 'rejected' }),
      Charity.countDocuments()
    ]);
    
    res.json({
      applications: {
        pending,
        underReview,
        approved,
        rejected,
        total: pending + underReview + approved + rejected
      },
      charities: {
        total: totalCharities
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
