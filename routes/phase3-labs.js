/**
 * Phase 3 Labs API Routes
 * 
 * This router provides:
 * - Intelligent lab validation
 * - Persistent session management
 * - Real-time monitoring
 * - Progress tracking
 * - Hint system
 */

const express = require('express');
const router = express.Router();
const ValidationEngine = require('../services/ValidationEngine');
const SessionManager = require('../services/SessionManager');
const phase3Labs = require('../data/phase3-labs');

// Initialize services
const validationEngine = new ValidationEngine();
const sessionManager = new SessionManager();

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  // For now, we'll use a simple token validation
  // In production, this should verify JWT tokens
  if (token === 'admin-token' || token.startsWith('eyJ')) {
    req.user = { id: '6a01a0be5965b07f4062320a' }; // Mock user ID
    next();
  } else {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Get Phase 3 labs
router.get('/labs', authenticateToken, async (req, res) => {
  try {
    const labs = Object.values(phase3Labs).map(lab => ({
      id: lab.id,
      title: lab.title,
      description: lab.description,
      category: lab.category,
      difficulty: lab.difficulty,
      duration: lab.duration,
      maxScore: lab.maxScore,
      objectives: lab.objectives,
      prerequisites: lab.prerequisites
    }));

    res.json({
      success: true,
      data: labs
    });
  } catch (error) {
    console.error('Error fetching Phase 3 labs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch labs'
    });
  }
});

// Get specific lab details
router.get('/labs/:labId', authenticateToken, async (req, res) => {
  try {
    const { labId } = req.params;
    const lab = phase3Labs[labId];

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    res.json({
      success: true,
      data: lab
    });
  } catch (error) {
    console.error('Error fetching lab details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab details'
    });
  }
});

// Start a new Phase 3 lab session
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { labId } = req.body;
    const userId = req.user.id;

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: 'Lab ID is required'
      });
    }

    const lab = phase3Labs[labId];
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Create persistent session
    const sessionResult = await sessionManager.createSession(userId, labId, lab);
    
    if (!sessionResult.success) {
      return res.status(500).json(sessionResult);
    }

    res.json(sessionResult);
  } catch (error) {
    console.error('Error starting Phase 3 lab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start lab'
    });
  }
});

// Resume an existing lab session
router.post('/resume/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await sessionManager.resumeSession(sessionId, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error resuming session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume session'
    });
  }
});

// Pause a lab session
router.post('/pause/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await sessionManager.pauseSession(sessionId, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error pausing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause session'
    });
  }
});

// Get session status
router.get('/session/:sessionId/status', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await sessionManager.getSessionStatus(sessionId, userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session status'
    });
  }
});

// Validate lab tasks
router.post('/validate/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get session information
    const sessionStatus = await sessionManager.getSessionStatus(sessionId, userId);
    if (!sessionStatus.success) {
      return res.status(404).json(sessionStatus);
    }

    // Get lab definition
    const lab = phase3Labs[sessionStatus.data.labId];
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab definition not found'
      });
    }

    // Create lab session object for validation
    const labSession = {
      sessionId,
      devices: Array.from(sessionStatus.data.deviceStates.values())
    };

    // Run validation
    const validationResult = await validationEngine.validateLab(labSession, lab);
    
    if (!validationResult.success) {
      return res.status(500).json(validationResult);
    }

    // Save validation results
    await sessionManager.saveValidationResults(sessionId, userId, validationResult.data);

    // Update progress
    await sessionManager.updateProgress(sessionId, userId, {
      overallScore: validationResult.data.overallScore,
      completedTasks: validationResult.data.tasks
        .filter(task => task.completed)
        .map(task => task.taskId)
    });

    res.json(validationResult);
  } catch (error) {
    console.error('Error validating lab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate lab'
    });
  }
});

// Get real-time device monitoring data
router.get('/monitor/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get session information
    const sessionStatus = await sessionManager.getSessionStatus(sessionId, userId);
    if (!sessionStatus.success) {
      return res.status(404).json(sessionStatus);
    }

    // Get monitoring data
    const monitoringData = await validationEngine.getDeviceMonitoringData({
      sessionId,
      devices: Array.from(sessionStatus.data.deviceStates.values())
    });

    res.json({
      success: true,
      data: monitoringData
    });
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring data'
    });
  }
});

// Update session progress
router.post('/progress/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const progressUpdate = req.body;

    const result = await sessionManager.updateProgress(sessionId, userId, progressUpdate);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Get user's lab sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const result = await sessionManager.getUserSessions(userId, status);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user sessions'
    });
  }
});

// Get session statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await sessionManager.getSessionStats(userId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session stats'
    });
  }
});

// Execute command in device (for terminal integration)
router.post('/command/:sessionId/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { sessionId, deviceId } = req.params;
    const { command } = req.body;
    const userId = req.user.id;

    // Verify session exists and belongs to user
    const sessionStatus = await sessionManager.getSessionStatus(sessionId, userId);
    if (!sessionStatus.success) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Execute command using LabOrchestrator
    const result = await sessionManager.labOrchestrator.executeCommand(
      sessionId,
      deviceId,
      command
    );

    res.json(result);
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute command'
    });
  }
});

// Get hints for current task
router.get('/hints/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get session status
    const sessionStatus = await sessionManager.getSessionStatus(sessionId, userId);
    if (!sessionStatus.success) {
      return res.status(404).json(sessionStatus);
    }

    // Return available hints
    const hints = sessionStatus.data.validationResults.hints || [];

    res.json({
      success: true,
      data: hints
    });
  } catch (error) {
    console.error('Error getting hints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hints'
    });
  }
});

// Clean up expired sessions (admin endpoint)
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const cleanedCount = await sessionManager.cleanupExpiredSessions();
    
    res.json({
      success: true,
      data: {
        cleanedSessions: cleanedCount
      }
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup sessions'
    });
  }
});

module.exports = router;
