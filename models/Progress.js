const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'failed'],
    default: 'not-started'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  taskProgress: [{
    taskId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'failed'],
      default: 'not-started'
    },
    attempts: {
      type: Number,
      default: 0
    },
    hintsUsed: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    commands: [{
      command: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      output: String,
      success: {
        type: Boolean,
        default: false
      }
    }],
    faults: [{
      faultId: String,
      detected: {
        type: Boolean,
        default: false
      },
      resolved: {
        type: Boolean,
        default: false
      },
      resolutionTime: {
        type: Number,
        default: 0 // in minutes
      }
    }]
  }],
  configuration: {
    devices: [{
      deviceId: String,
      configuration: String,
      lastModified: {
        type: Date,
        default: Date.now
      },
      isValid: {
        type: Boolean,
        default: false
      }
    }]
  },
  performance: {
    commandsExecuted: {
      type: Number,
      default: 0
    },
    errorsEncountered: {
      type: Number,
      default: 0
    },
    hintsRequested: {
      type: Number,
      default: 0
    },
    timeOnTask: {
      type: Number,
      default: 0 // in minutes
    },
    efficiency: {
      type: Number,
      default: 0 // percentage
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      maxlength: 500
    },
    difficulty: {
      type: String,
      enum: ['too-easy', 'just-right', 'too-hard']
    }
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedDate: Date,
    certificateId: String
  }
}, {
  timestamps: true
});

// Compound index for unique user-lab combination
progressSchema.index({ user: 1, lab: 1 }, { unique: true });

// Method to start lab
progressSchema.methods.startLab = function() {
  this.status = 'in-progress';
  this.startTime = new Date();
  return this.save();
};

// Method to complete task
progressSchema.methods.completeTask = function(taskId, points, timeSpent) {
  const taskProgress = this.taskProgress.find(tp => tp.taskId === taskId);
  if (taskProgress) {
    taskProgress.status = 'completed';
    taskProgress.pointsEarned = points;
    taskProgress.timeSpent = timeSpent;
    this.pointsEarned += points;
  }
  return this.save();
};

// Method to calculate score
progressSchema.methods.calculateScore = function() {
  if (this.totalPoints === 0) return 0;
  this.score = Math.round((this.pointsEarned / this.totalPoints) * 100);
  return this.score;
};

// Method to end lab
progressSchema.methods.endLab = function() {
  this.status = 'completed';
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // Convert to minutes
  }
  this.calculateScore();
  return this.save();
};

// Method to add command execution
progressSchema.methods.addCommand = function(taskId, command, output, success) {
  const taskProgress = this.taskProgress.find(tp => tp.taskId === taskId);
  if (taskProgress) {
    taskProgress.commands.push({
      command,
      output,
      success,
      timestamp: new Date()
    });
    taskProgress.attempts += 1;
    this.performance.commandsExecuted += 1;
    if (!success) {
      this.performance.errorsEncountered += 1;
    }
  }
  return this.save();
};

// Method to request hint
progressSchema.methods.requestHint = function(taskId) {
  const taskProgress = this.taskProgress.find(tp => tp.taskId === taskId);
  if (taskProgress) {
    taskProgress.hintsUsed += 1;
    this.performance.hintsRequested += 1;
  }
  return this.save();
};

// Method to get progress summary
progressSchema.methods.getSummary = function() {
  return {
    status: this.status,
    score: this.score,
    pointsEarned: this.pointsEarned,
    totalPoints: this.totalPoints,
    duration: this.duration,
    tasksCompleted: this.taskProgress.filter(tp => tp.status === 'completed').length,
    totalTasks: this.taskProgress.length,
    performance: this.performance
  };
};

module.exports = mongoose.model('Progress', progressSchema);
