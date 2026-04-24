const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lab title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Lab description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Lab category is required'],
    enum: ['routing', 'switching', 'security', 'troubleshooting', 'network-design', 'wireless'],
    index: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true
  },
  duration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [5, 'Duration must be at least 5 minutes']
  },
  objectives: [{
    type: String,
    required: true,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  topology: {
    type: {
      type: String,
      enum: ['star', 'mesh', 'bus', 'ring', 'hybrid', 'custom'],
      required: true
    },
    devices: [{
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['router', 'switch', 'firewall', 'server', 'workstation'],
        required: true
      },
      vendor: {
        type: String,
        enum: ['cisco', 'mikrotik', 'juniper', 'generic'],
        default: 'generic'
      },
      interfaces: [{
        name: {
          type: String,
          required: true
        },
        ipAddress: String,
        subnetMask: String,
        status: {
          type: String,
          enum: ['up', 'down'],
          default: 'up'
        }
      }],
      configuration: {
        type: String,
        default: ''
      }
    }],
    connections: [{
      fromDevice: {
        type: String,
        required: true
      },
      fromInterface: {
        type: String,
        required: true
      },
      toDevice: {
        type: String,
        required: true
      },
      toInterface: {
        type: String,
        required: true
      },
      bandwidth: {
        type: Number,
        default: 1000 // Mbps
      }
    }]
  },
  tasks: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['configuration', 'troubleshooting', 'verification', 'analysis'],
      required: true
    },
    points: {
      type: Number,
      required: true,
      min: 0
    },
    commands: [{
      command: String,
      expectedOutput: String,
      validationType: {
        type: String,
        enum: ['exact', 'contains', 'regex'],
        default: 'contains'
      }
    }],
    hints: [{
      level: {
        type: Number,
        min: 1,
        max: 3
      },
      text: String
    }]
  }],
  faults: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['interface-down', 'ip-conflict', 'routing-loop', 'misconfiguration', 'bandwidth-limit'],
      required: true
    },
    description: String,
    affectedDevice: String,
    affectedInterface: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  solution: {
    steps: [{
      step: Number,
      description: String,
      commands: [String],
      verification: String
    }],
    explanation: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
labSchema.index({ category: 1, difficulty: 1 });
labSchema.index({ tags: 1 });
labSchema.index({ 'rating.average': -1 });

// Method to calculate total points
labSchema.methods.getTotalPoints = function() {
  return this.tasks.reduce((total, task) => total + task.points, 0);
};

// Method to get lab summary
labSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    category: this.category,
    difficulty: this.difficulty,
    duration: this.duration,
    totalPoints: this.getTotalPoints(),
    deviceCount: this.topology.devices.length,
    taskCount: this.tasks.length,
    rating: this.rating,
    tags: this.tags
  };
};

module.exports = mongoose.model('Lab', labSchema);
