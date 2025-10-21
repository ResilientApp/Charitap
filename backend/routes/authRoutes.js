const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
};

// Traditional signup with email and password
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      authProvider: 'local',
      displayName: displayName || email.split('@')[0]
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        displayName: newUser.displayName || `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim(),
        authProvider: newUser.authProvider,
        profilePicture: newUser.profilePicture,
        paymentPreference: newUser.paymentPreference,
        selectedCharities: newUser.selectedCharities
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Traditional login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(400).json({ 
        error: 'This account uses Google Sign-In. Please login with Google.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
        paymentPreference: user.paymentPreference,
        selectedCharities: user.selectedCharities
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Google OAuth login/signup
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, displayName, profilePicture } = req.body;

    // Validate input
    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // Existing Google user - login
      user.lastLogin = new Date();
      // Update profile info in case it changed
      user.displayName = displayName || user.displayName;
      user.profilePicture = profilePicture || user.profilePicture;
      await user.save();
    } else {
      // Check if email exists with different auth provider
      const existingEmailUser = await User.findOne({ email });
      
      if (existingEmailUser && existingEmailUser.authProvider === 'local') {
        return res.status(400).json({ 
          error: 'An account with this email already exists. Please login with email and password.' 
        });
      }

      // New Google user - signup
      user = new User({
        googleId,
        email,
        displayName: displayName || email.split('@')[0],
        profilePicture,
        authProvider: 'google'
      });

      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: user.lastLogin ? 'Login successful' : 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Error with Google authentication' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        displayName: req.user.displayName,
        authProvider: req.user.authProvider,
        profilePicture: req.user.profilePicture,
        paymentPreference: req.user.paymentPreference,
        selectedCharities: req.user.selectedCharities
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Update user profile
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, displayName, paymentPreference, selectedCharities } = req.body;

    if (firstName !== undefined) req.user.firstName = firstName;
    if (lastName !== undefined) req.user.lastName = lastName;
    if (displayName !== undefined) req.user.displayName = displayName;
    if (paymentPreference) req.user.paymentPreference = paymentPreference;
    if (selectedCharities) req.user.selectedCharities = selectedCharities;

    await req.user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        displayName: req.user.displayName,
        paymentPreference: req.user.paymentPreference,
        selectedCharities: req.user.selectedCharities
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Change password (only for local auth users)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.authProvider !== 'local') {
      return res.status(400).json({ 
        error: 'Password change is only available for email/password accounts' 
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    req.user.password = hashedPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

// Toggle charity selection
router.post('/settings/charities/toggle', authenticateToken, async (req, res) => {
  try {
    const { charityId } = req.body;

    if (!charityId) {
      return res.status(400).json({ error: 'Charity ID is required' });
    }

    // Check if charity exists in selectedCharities
    const charityIndex = req.user.selectedCharities.findIndex(
      id => id.toString() === charityId
    );

    if (charityIndex > -1) {
      // Charity is selected, remove it
      req.user.selectedCharities.splice(charityIndex, 1);
    } else {
      // Charity is not selected, add it
      req.user.selectedCharities.push(charityId);
    }

    await req.user.save();

    res.json({
      message: 'Charity selection updated',
      selectedCharities: req.user.selectedCharities,
      isSelected: charityIndex === -1 // true if we just added it
    });
  } catch (error) {
    console.error('Toggle charity error:', error);
    res.status(500).json({ error: 'Error updating charity selection' });
  }
});

// Update all selected charities at once
router.patch('/settings/charities', authenticateToken, async (req, res) => {
  try {
    const { charityIds } = req.body;

    if (!Array.isArray(charityIds)) {
      return res.status(400).json({ error: 'charityIds must be an array' });
    }

    req.user.selectedCharities = charityIds;
    await req.user.save();

    res.json({
      message: 'Selected charities updated',
      selectedCharities: req.user.selectedCharities
    });
  } catch (error) {
    console.error('Update charities error:', error);
    res.status(500).json({ error: 'Error updating selected charities' });
  }
});

// Update payment preference
router.patch('/settings/payment-preference', authenticateToken, async (req, res) => {
  try {
    const { paymentPreference } = req.body;

    if (!paymentPreference) {
      return res.status(400).json({ error: 'Payment preference is required' });
    }

    if (!['threshold', 'monthly'].includes(paymentPreference)) {
      return res.status(400).json({ 
        error: 'Payment preference must be either "threshold" or "monthly"' 
      });
    }

    req.user.paymentPreference = paymentPreference;
    await req.user.save();

    res.json({
      message: 'Payment preference updated',
      paymentPreference: req.user.paymentPreference
    });
  } catch (error) {
    console.error('Update payment preference error:', error);
    res.status(500).json({ error: 'Error updating payment preference' });
  }
});

module.exports = router;

