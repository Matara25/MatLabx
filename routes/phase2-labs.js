const express = require('express');
const router = express.Router();
const LabOrchestrator = require('../services/LabOrchestrator');
const PREDEFINED_LABS = require('../data/predefined-labs');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Initialize Lab Orchestrator
const labOrchestrator = new LabOrchestrator();

// Get all predefined labs
router.get('/predefined', protect, (req, res) => {
  try {
    const labs = Object.values(PREDEFINED_LABS);
    res.json({
      success: true,
      data: labs
    });
  } catch (error) {
    logger.error('Error fetching predefined labs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch labs'
    });
  }
});

// Get specific predefined lab
router.get('/predefined/:labId', protect, (req, res) => {
  try {
    const { labId } = req.params;
    const lab = PREDEFINED_LABS[labId];
    
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
    logger.error('Error fetching lab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab'
    });
  }
});

// Start a lab session
router.post('/start', protect, async (req, res) => {
  try {
    const { labId } = req.body;
    const userId = req.user.id;
    
    // Get lab configuration
    const labConfig = PREDEFINED_LABS[labId];
    if (!labConfig) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    
    // Start lab session
    const sessionId = await labOrchestrator.startLab(labId, userId, labConfig);
    
    res.json({
      success: true,
      data: {
        sessionId,
        labConfig,
        status: 'starting'
      }
    });
    
    logger.info(`Lab session started: ${sessionId} for user ${userId}`);
  } catch (error) {
    logger.error('Error starting lab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start lab'
    });
  }
});

// Stop a lab session
router.post('/stop/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Verify session belongs to user
    const session = labOrchestrator.getLabSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    await labOrchestrator.stopLab(sessionId);
    
    res.json({
      success: true,
      message: 'Lab session stopped'
    });
    
    logger.info(`Lab session stopped: ${sessionId}`);
  } catch (error) {
    logger.error('Error stopping lab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop lab'
    });
  }
});

// Get lab session status
router.get('/session/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const session = labOrchestrator.getLabSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        topology: session.topology,
        devices: Array.from(session.devices.entries()).map(([id, device]) => ({
          id,
          type: device.device.type,
          name: device.device.name,
          status: device.status
        })),
        networks: Array.from(session.networks.keys()),
        ipAddressing: Object.fromEntries(session.ipAddressing)
      }
    });
  } catch (error) {
    logger.error('Error fetching session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session status'
    });
  }
});

// Attach terminal to device
router.post('/terminal/attach', protect, async (req, res) => {
  try {
    const { sessionId, deviceId } = req.body;
    const userId = req.user.id;
    
    // Verify session belongs to user
    const session = labOrchestrator.getLabSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Attach terminal to device
    const terminalInfo = await labOrchestrator.attachTerminal(sessionId, deviceId);
    
    res.json({
      success: true,
      data: {
        attached: true,
        deviceId,
        sessionId
      }
    });
    
    logger.info(`Terminal attached to device ${deviceId} in session ${sessionId}`);
  } catch (error) {
    logger.error('Error attaching terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to attach terminal'
    });
  }
});

// Execute command on device
router.post('/command', protect, async (req, res) => {
  try {
    const { sessionId, deviceId, command } = req.body;
    const userId = req.user.id;
    
    // Verify session belongs to user
    const session = labOrchestrator.getLabSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Get device
    const device = session.devices.get(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Execute command
    const output = await labOrchestrator.executeCommand(device.container, command);
    
    res.json({
      success: true,
      data: {
        output,
        deviceId,
        command
      }
    });
  } catch (error) {
    logger.error('Error executing command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute command'
    });
  }
});

// Get device status
router.get('/device/:sessionId/:deviceId', protect, async (req, res) => {
  try {
    const { sessionId, deviceId } = req.params;
    const userId = req.user.id;
    
    // Verify session belongs to user
    const session = labOrchestrator.getLabSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Get device
    const device = session.devices.get(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Get device interfaces and IP addresses
    const interfaces = [];
    for (const [key, ipInfo] of session.ipAddressing) {
      if (key.startsWith(deviceId)) {
        interfaces.push({
          name: key.split('-')[1],
          ip: ipInfo.ip,
          subnet: ipInfo.subnet,
          network: ipInfo.network
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        deviceId,
        type: device.device.type,
        name: device.device.name,
        status: device.status,
        interfaces
      }
    });
  } catch (error) {
    logger.error('Error fetching device status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device status'
    });
  }
});

// Verify lab task completion
router.post('/verify/:sessionId/:taskId', protect, async (req, res) => {
  try {
    const { sessionId, taskId } = req.params;
    const userId = req.user.id;
    
    // Verify session belongs to user
    const session = labOrchestrator.getLabSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Get lab configuration
    const labConfig = PREDEFINED_LABS[session.labId];
    if (!labConfig) {
      return res.status(404).json({
        success: false,
        message: 'Lab configuration not found'
      });
    }
    
    // Find task
    const task = labConfig.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Perform verification based on task type
    let verificationResult = { success: false, message: 'Verification failed' };
    
    if (task.verification.type === 'command') {
      // Execute verification command on appropriate device
      const deviceId = task.verification.deviceId || session.topology.devices[0].id;
      const device = session.devices.get(deviceId);
      
      if (device) {
        const output = await labOrchestrator.executeCommand(device.container, task.verification.command);
        verificationResult = {
          success: output.includes(task.verification.expected),
          message: output.includes(task.verification.expected) ? 'Task completed successfully' : 'Task verification failed',
          output
        };
      }
    } else if (task.verification.type === 'connectivity') {
      // Test connectivity
      const deviceId = session.topology.devices[0].id;
      const device = session.devices.get(deviceId);
      
      if (device) {
        const output = await labOrchestrator.executeCommand(device.container, `ping -c 3 ${task.verification.target}`);
        verificationResult = {
          success: output.includes('bytes from') && !output.includes('100% packet loss'),
          message: output.includes('bytes from') ? 'Connectivity test passed' : 'Connectivity test failed',
          output
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        taskId,
        completed: verificationResult.success,
        points: verificationResult.success ? task.points : 0,
        verification: verificationResult
      }
    });
  } catch (error) {
    logger.error('Error verifying task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify task'
    });
  }
});

// Get user's active lab sessions
router.get('/my-sessions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const activeLabs = labOrchestrator.getActiveLabs();
    
    // Filter sessions belonging to this user
    const userSessions = activeLabs.filter(session => session.userId === userId);
    
    res.json({
      success: true,
      data: userSessions.map(session => ({
        sessionId: session.id,
        labId: session.labId,
        status: session.status,
        createdAt: session.createdAt,
        deviceCount: session.devices.size,
        networkCount: session.networks.size
      }))
    });
  } catch (error) {
    logger.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// Export for use in Socket.IO
module.exports = {
  router,
  labOrchestrator
};
