const express = require('express');
const Lab = require('../models/Lab');
const Progress = require('../models/Progress');
const NetworkSimulator = require('../services/NetworkSimulator');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// Global simulator instance
const simulator = new NetworkSimulator();

// @desc    Start a lab simulation
// @route   POST /api/simulation/start/:labId
// @access  Private
router.post('/start/:labId', protect, async (req, res) => {
  try {
    const labId = req.params.labId;
    const userId = req.user.id;

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user already has an active session for this lab
    const existingProgress = await Progress.findOne({
      user: userId,
      lab: labId,
      status: 'in-progress'
    });

    if (existingProgress) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active session for this lab'
      });
    }

    // Create simulation session
    const sessionId = await simulator.createSession(labId, userId);

    // Initialize topology
    await simulator.initializeTopology(sessionId, lab.topology);

    // Create or update progress record
    let progress = await Progress.findOne({ user: userId, lab: labId });
    
    if (!progress) {
      progress = await Progress.create({
        user: userId,
        lab: labId,
        totalPoints: lab.getTotalPoints(),
        taskProgress: lab.tasks.map(task => ({
          taskId: task.id,
          status: 'not-started',
          attempts: 0,
          hintsUsed: 0,
          timeSpent: 0,
          pointsEarned: 0,
          commands: [],
          faults: lab.faults.map(fault => ({
            faultId: fault.id,
            detected: false,
            resolved: false,
            resolutionTime: 0
          }))
        }))
      });
    }

    // Start the lab
    await progress.startLab();

    // Inject initial faults if any
    if (lab.faults && lab.faults.length > 0) {
      for (const fault of lab.faults) {
        await simulator.injectFault(sessionId, fault);
      }
    }

    logger.info(`Started simulation for user ${userId}, lab ${labId}, session ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Simulation started successfully',
      data: {
        sessionId,
        lab: lab.getSummary(),
        progress: progress.getSummary()
      }
    });
  } catch (error) {
    logger.error(`Start simulation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to start simulation',
      error: error.message
    });
  }
});

// @desc    Execute command in simulation
// @route   POST /api/simulation/execute/:sessionId
// @access  Private
router.post('/execute/:sessionId', protect, async (req, res) => {
  try {
    const { deviceId, command, taskId } = req.body;
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    if (!deviceId || !command) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and command are required'
      });
    }

    // Execute command
    const result = await simulator.executeCommand(sessionId, deviceId, command);

    // Update progress if taskId is provided
    if (taskId && result.success) {
      const progress = await Progress.findOne({
        user: userId,
        'lab.topology.devices.id': deviceId
      }).populate('lab');

      if (progress) {
        await progress.addCommand(taskId, command, result.output, result.success);
      }
    }

    // Emit real-time update to connected clients
    const io = req.app.get('io');
    io.to(`lab-${sessionId}`).emit('commandExecuted', {
      sessionId,
      deviceId,
      command,
      result
    });

    res.status(200).json({
      success: true,
      data: {
        deviceId,
        command,
        result
      }
    });
  } catch (error) {
    logger.error(`Execute command error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to execute command',
      error: error.message
    });
  }
});

// @desc    Get device status
// @route   GET /api/simulation/status/:sessionId/:deviceId
// @access  Private
router.get('/status/:sessionId/:deviceId', protect, async (req, res) => {
  try {
    const { sessionId, deviceId } = req.params;

    const status = await simulator.getDeviceStatus(sessionId, deviceId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error(`Get device status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get device status',
      error: error.message
    });
  }
});

// @desc    Complete a task
// @route   POST /api/simulation/complete-task/:sessionId
// @access  Private
router.post('/complete-task/:sessionId', protect, async (req, res) => {
  try {
    const { taskId, timeSpent } = req.body;
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Get progress record
    const progress = await Progress.findOne({
      user: userId
    }).populate('lab');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    // Find the task in the lab
    const task = progress.lab.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Validate task completion
    const isValid = await simulator.validateTaskCompletion(sessionId, task);
    
    if (isValid.success) {
      // Complete the task
      await progress.completeTask(taskId, task.points, timeSpent || 0);
      
      // Check if all tasks are completed
      const allTasksCompleted = progress.taskProgress.every(
        tp => tp.status === 'completed'
      );

      if (allTasksCompleted) {
        await progress.endLab();
        
        // Update user stats
        const User = require('../models/User');
        const user = await User.findById(userId);
        await user.updateStats(progress.score, progress.duration);
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`lab-${sessionId}`).emit('taskCompleted', {
        sessionId,
        taskId,
        points: task.points,
        progress: progress.getSummary()
      });

      res.status(200).json({
        success: true,
        message: 'Task completed successfully',
        data: {
          taskId,
          pointsEarned: task.points,
          progress: progress.getSummary(),
          labCompleted: allTasksCompleted
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Task validation failed',
        details: isValid.message
      });
    }
  } catch (error) {
    logger.error(`Complete task error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
});

// @desc    Request hint for a task
// @route   POST /api/simulation/hint/:sessionId
// @access  Private
router.post('/hint/:sessionId', protect, async (req, res) => {
  try {
    const { taskId, level } = req.body;
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Get progress record
    const progress = await Progress.findOne({
      user: userId
    }).populate('lab');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }

    // Find the task in the lab
    const task = progress.lab.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get hint for the specified level
    const hint = task.hints.find(h => h.level === (level || 1));
    
    if (!hint) {
      return res.status(404).json({
        success: false,
        message: 'Hint not found for this level'
      });
    }

    // Update hint usage
    await progress.requestHint(taskId);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`lab-${sessionId}`).emit('hintRequested', {
      sessionId,
      taskId,
      level: hint.level,
      hint: hint.text
    });

    res.status(200).json({
      success: true,
      data: {
        taskId,
        level: hint.level,
        hint: hint.text
      }
    });
  } catch (error) {
    logger.error(`Request hint error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get hint',
      error: error.message
    });
  }
});

// @desc    Stop simulation session
// @route   POST /api/simulation/stop/:sessionId
// @access  Private
router.post('/stop/:sessionId', protect, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    // Cleanup simulation
    await simulator.cleanupSession(sessionId);

    // Update progress if session was active
    const progress = await Progress.findOne({
      user: userId
    });

    if (progress && progress.status === 'in-progress') {
      await progress.endLab();
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`lab-${sessionId}`).emit('simulationStopped', {
      sessionId
    });

    logger.info(`Stopped simulation for user ${userId}, session ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Simulation stopped successfully'
    });
  } catch (error) {
    logger.error(`Stop simulation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to stop simulation',
      error: error.message
    });
  }
});

// @desc    Get simulation session info
// @route   GET /api/simulation/session/:sessionId
// @access  Private
router.get('/session/:sessionId', protect, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    // Get session info from simulator
    const session = simulator.activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user owns this session
    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get progress info
    const progress = await Progress.findOne({
      user: userId
    }).populate('lab');

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          labId: session.labId,
          status: session.status,
          createdAt: session.createdAt
        },
        progress: progress ? progress.getSummary() : null
      }
    });
  } catch (error) {
    logger.error(`Get session info error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get session info',
      error: error.message
    });
  }
});

// Extend NetworkSimulator with validation method
NetworkSimulator.prototype.validateTaskCompletion = async function(sessionId, task) {
  try {
    // Validate based on task type and expected commands
    for (const commandValidation of task.commands) {
      const result = await this.executeCommand(sessionId, task.deviceId || 'router1', commandValidation.command);
      
      if (!result.success) {
        return { success: false, message: 'Command execution failed' };
      }

      // Validate output based on validation type
      let isValid = false;
      switch (commandValidation.validationType) {
        case 'exact':
          isValid = result.output === commandValidation.expectedOutput;
          break;
        case 'contains':
          isValid = result.output.includes(commandValidation.expectedOutput);
          break;
        case 'regex':
          const regex = new RegExp(commandValidation.expectedOutput);
          isValid = regex.test(result.output);
          break;
        default:
          isValid = result.output.includes(commandValidation.expectedOutput);
      }

      if (!isValid) {
        return { success: false, message: 'Output validation failed' };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = router;
