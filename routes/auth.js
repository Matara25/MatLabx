const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password, role = 'student', profile } = req.body;
    
    // Handle both username and name fields from frontend
    const finalUsername = username || name;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: finalUsername }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      username: finalUsername,
      email,
      password,
      role,
      profile: profile || {}
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        stats: user.stats
      }
    });
  } catch (error) {
    console.log("=== REGISTER ERROR DETAILS ===");
    console.log("Error object:", error);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
    console.log("Request body:", req.body);
    
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log("=== LOGIN HIT ===");
    console.log("Request body:", req.body);

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    console.log("Step 1: Finding user with email:", email);

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log("Step 2: User found:", !!user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log("Step 3: Comparing password");

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log("Step 4: Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log("Step 5: Checking user active status:", user.isActive);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    console.log("Step 6: Updating last login");

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log("Step 7: User saved successfully");

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        stats: user.stats,
        lastLogin: user.lastLogin,
        isVerified: user.isVerified || false,
        hasCompletedOnboarding: user.hasCompletedOnboarding || false,
        goals: user.goals,
        skills: user.skills
      }
    });
  } catch (error) {
    console.log("=== LOGIN ERROR DETAILS ===");
    console.log("Error object:", error);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
    console.log("Request body:", req.body);
    
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        stats: user.stats,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { profile } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          'profile.firstName': profile.firstName,
          'profile.lastName': profile.lastName,
          'profile.institution': profile.institution,
          'profile.experienceLevel': profile.experienceLevel
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        stats: user.stats
      }
    });
  } catch (error) {
    logger.error(`Profile update error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error(`Password change error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// @desc    Complete user onboarding
// @route   POST /api/auth/complete-onboarding
// @access  Private
router.post('/complete-onboarding', protect, async (req, res) => {
  try {
    const { profile, skills, goals } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user with onboarding data
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    if (skills) {
      user.skills = skills;
    }
    if (goals) {
      user.goals = goals;
    }

    user.hasCompletedOnboarding = true;
    await user.save();

    logger.info(`Onboarding completed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        skills: user.skills,
        goals: user.goals,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    });
  } catch (error) {
    logger.error(`Onboarding completion error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during onboarding completion'
    });
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Fix student account verification status
// @route   POST /api/auth/fix-student
// @access  Public (temporary)
router.post('/fix-student', async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findOne({ email: 'student@matlabx.com' });
    
    if (student) {
      // Update student account to be verified and completed onboarding
      await User.updateOne(
        { email: 'student@matlabx.com' },
        {
          $set: {
            isVerified: true,
            hasCompletedOnboarding: true
          }
        }
      );
      
      res.json({
        success: true,
        message: 'Student account fixed successfully',
        details: {
          isVerified: true,
          hasCompletedOnboarding: true
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
