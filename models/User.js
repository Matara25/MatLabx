const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    institution: {
      type: String,
      trim: true,
      maxlength: [100, 'Institution name cannot exceed 100 characters']
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  stats: {
    labsCompleted: {
      type: Number,
      default: 0
    },
    totalLabTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageScore: {
      type: Number,
      default: 0
    },
    skills: [{
      skill: {
        type: String,
        enum: ['routing', 'switching', 'security', 'troubleshooting', 'network-design']
      },
      level: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  skills: [{
    type: String,
    enum: ['routing', 'switching', 'security', 'wireless', 'automation', 'troubleshooting']
  }],
  goals: [{
    type: String,
    enum: ['certification', 'career', 'skills', 'practice']
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update user stats
userSchema.methods.updateStats = function(labScore, labTime) {
  this.stats.labsCompleted += 1;
  this.stats.totalLabTime += labTime;
  
  // Update average score
  const totalScore = this.stats.averageScore * (this.stats.labsCompleted - 1) + labScore;
  this.stats.averageScore = totalScore / this.stats.labsCompleted;
  
  return this.save();
};

// Method to get user progress
userSchema.methods.getProgress = function() {
  return {
    labsCompleted: this.stats.labsCompleted,
    totalLabTime: this.stats.totalLabTime,
    averageScore: Math.round(this.stats.averageScore * 100) / 100,
    skills: this.stats.skills
  };
};

module.exports = mongoose.model('User', userSchema);
