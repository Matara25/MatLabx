/**
 * SessionManager - Persistent Lab Sessions Management
 * 
 * This service handles:
 * - Lab session persistence in MongoDB
 * - State saving and restoring
 * - Progress tracking
 * - Configuration backup/restore
 * - Session lifecycle management
 */

const mongoose = require('mongoose');
const LabOrchestrator = require('./LabOrchestrator');

// MongoDB Schema for Lab Sessions
const LabSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  labId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'running', 'paused', 'completed', 'failed'],
    default: 'created'
  },
  
  // Lab configuration and state
  labConfig: {
    topology: Object,
    devices: [Object],
    links: [Object],
    objectives: [String],
    tasks: [Object]
  },
  
  // Current state information
  deviceStates: {
    type: Object,
    default: {}
  },
  
  // Progress tracking
  progress: {
    currentTask: { type: Number, default: 0 },
    completedTasks: { type: [String], default: [] },
    taskScores: { type: Object, default: {} },
    overallScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    startTime: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    timeSpent: { type: Number, default: 0 } // in minutes
  },
  
  // Validation results
  validationResults: {
    lastValidation: Date,
    taskResults: [Object],
    hints: [Object],
    overallScore: Number
  },
  
  // Device configurations for persistence
  deviceConfigs: {
    type: Object,
    default: {}
  },
  
  // Session metadata
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true
});

const LabSession = mongoose.model('LabSession', LabSessionSchema);

class SessionManager {
  constructor() {
    this.labOrchestrator = new LabOrchestrator();
    this.activeSessions = new Map(); // In-memory cache for active sessions
  }

  /**
   * Create a new persistent lab session
   */
  async createSession(userId, labId, labConfig) {
    try {
      const sessionId = this.generateSessionId(userId, labId);
      
      // Create session in database
      const session = new LabSession({
        sessionId,
        userId,
        labId,
        labConfig,
        progress: {
          currentTask: 0,
          completedTasks: [],
          taskScores: new Map(),
          overallScore: 0,
          maxScore: labConfig.maxScore || 100,
          startTime: new Date(),
          lastActivity: new Date(),
          timeSpent: 0
        },
        metadata: {
          expiresAt: this.calculateExpiryDate(),
          version: '1.0'
        }
      });

      await session.save();

      // Start the lab with LabOrchestrator
      const labResult = await this.labOrchestrator.startLab(sessionId, labConfig);
      
      if (!labResult.success) {
        throw new Error(`Failed to start lab: ${labResult.error}`);
      }

      // Update session with running state
      session.status = 'running';
      session.deviceStates = this.extractDeviceStates(labResult.data);
      await session.save();

      // Cache session in memory
      this.activeSessions.set(sessionId, session);

      return {
        success: true,
        data: {
          sessionId,
          status: 'running',
          devices: labResult.data.devices,
          topology: labConfig.topology
        }
      };

    } catch (error) {
      console.error('Failed to create session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resume an existing lab session
   */
  async resumeSession(sessionId, userId) {
    try {
      // Find session in database
      const session = await LabSession.findOne({ sessionId, userId });
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if session is still valid
      if (this.isSessionExpired(session)) {
        throw new Error('Session has expired');
      }

      // Restore lab state
      const restoreResult = await this.restoreLabState(session);
      if (!restoreResult.success) {
        throw new Error(`Failed to restore lab state: ${restoreResult.error}`);
      }

      // Update session status
      session.status = 'running';
      session.progress.lastActivity = new Date();
      await session.save();

      // Cache session in memory
      this.activeSessions.set(sessionId, session);

      return {
        success: true,
        data: {
          sessionId,
          status: 'running',
          progress: session.progress,
          validationResults: session.validationResults,
          devices: restoreResult.data.devices,
          topology: session.labConfig.topology
        }
      };

    } catch (error) {
      console.error('Failed to resume session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pause a lab session (save state and stop containers)
   */
  async pauseSession(sessionId, userId) {
    try {
      const session = await this.findSession(sessionId, userId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Save current device configurations
      const configs = await this.backupDeviceConfigs(session);
      session.deviceConfigs = configs;

      // Update progress time spent
      const now = new Date();
      const timeSpent = Math.round((now - session.progress.lastActivity) / (1000 * 60)); // minutes
      session.progress.timeSpent += timeSpent;
      session.progress.lastActivity = now;

      // Save session state
      session.status = 'paused';
      session.deviceStates = await this.getCurrentDeviceStates(session);
      await session.save();

      // Stop the lab
      await this.labOrchestrator.stopLab(sessionId);

      // Remove from active cache
      this.activeSessions.delete(sessionId);

      return {
        success: true,
        data: {
          sessionId,
          status: 'paused',
          progress: session.progress
        }
      };

    } catch (error) {
      console.error('Failed to pause session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get session status and progress
   */
  async getSessionStatus(sessionId, userId) {
    try {
      const session = await this.findSession(sessionId, userId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get real-time device states if session is running
      let deviceStates = session.deviceStates;
      if (session.status === 'running') {
        deviceStates = await this.getCurrentDeviceStates(session);
      }

      return {
        success: true,
        data: {
          sessionId,
          status: session.status,
          progress: session.progress,
          validationResults: session.validationResults,
          deviceStates,
          metadata: {
            createdAt: session.metadata.createdAt,
            updatedAt: session.metadata.updatedAt,
            expiresAt: session.metadata.expiresAt
          }
        }
      };

    } catch (error) {
      console.error('Failed to get session status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update session progress
   */
  async updateProgress(sessionId, userId, progressUpdate) {
    try {
      const session = await this.findSession(sessionId, userId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Update progress
      if (progressUpdate.currentTask !== undefined) {
        session.progress.currentTask = progressUpdate.currentTask;
      }

      if (progressUpdate.completedTasks) {
        session.progress.completedTasks = progressUpdate.completedTasks;
      }

      if (progressUpdate.taskScores) {
        session.progress.taskScores = { ...session.progress.taskScores, ...progressUpdate.taskScores };
      }

      if (progressUpdate.overallScore !== undefined) {
        session.progress.overallScore = progressUpdate.overallScore;
      }

      session.progress.lastActivity = new Date();
      await session.save();

      // Update cached session
      if (this.activeSessions.has(sessionId)) {
        this.activeSessions.set(sessionId, session);
      }

      return {
        success: true,
        data: session.progress
      };

    } catch (error) {
      console.error('Failed to update progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save validation results
   */
  async saveValidationResults(sessionId, userId, validationResults) {
    try {
      const session = await this.findSession(sessionId, userId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.validationResults = {
        lastValidation: new Date(),
        taskResults: validationResults.tasks,
        hints: validationResults.hints,
        overallScore: validationResults.overallScore
      };

      // Update progress with validation scores
      session.progress.overallScore = validationResults.overallScore;
      
      // Mark completed tasks
      const completedTasks = validationResults.tasks
        .filter(task => task.completed)
        .map(task => task.taskId);
      
      session.progress.completedTasks = [...new Set([...session.progress.completedTasks, ...completedTasks])];

      await session.save();

      return {
        success: true,
        data: session.validationResults
      };

    } catch (error) {
      console.error('Failed to save validation results:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's lab sessions
   */
  async getUserSessions(userId, status = null) {
    try {
      const query = { userId };
      if (status) {
        query.status = status;
      }

      const sessions = await LabSession.find(query)
        .sort({ 'metadata.updatedAt': -1 })
        .select('sessionId labId status progress metadata.updatedAt metadata.expiresAt');

      return {
        success: true,
        data: sessions
      };

    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const result = await LabSession.deleteMany({
        'metadata.expiresAt': { $lt: new Date() }
      });

      console.log(`Cleaned up ${result.deletedCount} expired sessions`);
      return result.deletedCount;

    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  // Helper methods

  generateSessionId(userId, labId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}_${labId}_${timestamp}_${random}`;
  }

  calculateExpiryDate() {
    // Sessions expire after 7 days by default
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }

  isSessionExpired(session) {
    return session.metadata.expiresAt && new Date() > session.metadata.expiresAt;
  }

  async findSession(sessionId, userId) {
    // Try cache first
    if (this.activeSessions.has(sessionId)) {
      const cachedSession = this.activeSessions.get(sessionId);
      if (cachedSession.userId === userId) {
        return cachedSession;
      }
    }

    // Fall back to database
    return await LabSession.findOne({ sessionId, userId });
  }

  extractDeviceStates(labData) {
    const states = {};
    
    if (labData.devices) {
      for (const device of labData.devices) {
        states[device.id] = {
          containerName: device.containerName,
          status: 'running',
          interfaces: device.interfaces || [],
          lastSeen: new Date()
        };
      }
    }

    return states;
  }

  async getCurrentDeviceStates(session) {
    try {
      const labData = await this.labOrchestrator.getLabSession(session.sessionId);
      return this.extractDeviceStates(labData);
    } catch (error) {
      console.error('Failed to get current device states:', error);
      return session.deviceStates;
    }
  }

  async restoreLabState(session) {
    try {
      // Start the lab with existing configuration
      const result = await this.labOrchestrator.startLab(session.sessionId, session.labConfig);
            // Restore device configurations if they exist
        if (session.deviceConfigs && Object.keys(session.deviceConfigs).length > 0) {
          await this.restoreDeviceConfigs(session);
        }

      return result;

    } catch (error) {
      console.error('Failed to restore lab state:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async backupDeviceConfigs(session) {
    const configs = {};
    
    for (const [deviceId, deviceState] of session.deviceStates) {
      try {
        const containerName = deviceState.containerName;
        const config = await this.labOrchestrator.executeCommand(
          session.sessionId,
          deviceId,
          'vtysh -c "show running-config"'
        );
        configs[deviceId] = config;
      } catch (error) {
        console.error(`Failed to backup config for ${deviceId}:`, error);
        configs[deviceId] = '';
      }
    }

    return configs;
  }

  async restoreDeviceConfigs(session) {
    for (const deviceId in session.deviceConfigs) {
      try {
        const config = session.deviceConfigs[deviceId];
        if (config && config.trim()) {
          // Restore configuration (this would need to be implemented in LabOrchestrator)
          await this.labOrchestrator.restoreDeviceConfig(
            session.sessionId,
            deviceId,
            config
          );
        }
      } catch (error) {
        console.error(`Failed to restore config for ${deviceId}:`, error);
      }
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(userId) {
    try {
      const stats = await LabSession.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgScore: { $avg: '$progress.overallScore' },
            totalTime: { $sum: '$progress.timeSpent' }
          }
        }
      ]);

      const totalSessions = await LabSession.countDocuments({ userId });
      const completedSessions = await LabSession.countDocuments({ 
        userId, 
        status: 'completed' 
      });

      return {
        success: true,
        data: {
          totalSessions,
          completedSessions,
          completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(1) : 0,
          stats: stats.reduce((acc, stat) => {
            acc[stat._id] = stat;
            return acc;
          }, {})
        }
      };

    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SessionManager;
