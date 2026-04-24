const express = require('express');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { protect, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// @desc    Get user profile with progress
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get user's progress statistics
    const progressStats = await Progress.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalTime: { $sum: '$duration' }
        }
      }
    ]);

    const stats = {
      totalLabs: progressStats.reduce((sum, stat) => sum + stat.count, 0),
      completedLabs: progressStats.find(s => s._id === 'completed')?.count || 0,
      inProgressLabs: progressStats.find(s => s._id === 'in-progress')?.count || 0,
      averageScore: progressStats.find(s => s._id === 'completed')?.avgScore || 0,
      totalTimeSpent: progressStats.reduce((sum, stat) => sum + (stat.totalTime || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          stats: user.stats,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        progressStats: stats
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @desc    Get user's lab history
// @route   GET /api/users/labs/history
// @access  Private
router.get('/labs/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const progress = await Progress.find({ user: req.user.id })
      .populate('lab', 'title category difficulty duration')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Progress.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: progress.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: progress.map(p => ({
        id: p._id,
        lab: p.lab,
        status: p.status,
        score: p.score,
        pointsEarned: p.pointsEarned,
        totalPoints: p.totalPoints,
        duration: p.duration,
        startedAt: p.startTime,
        completedAt: p.endTime,
        tasksCompleted: p.taskProgress.filter(tp => tp.status === 'completed').length,
        totalTasks: p.taskProgress.length
      }))
    });
  } catch (error) {
    logger.error(`Get lab history error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lab history'
    });
  }
});

// @desc    Get user's achievements/badges
// @route   GET /api/users/achievements
// @access  Private
router.get('/achievements', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get completed labs count
    const completedLabs = await Progress.countDocuments({
      user: req.user.id,
      status: 'completed'
    });

    // Define achievements
    const achievements = [
      {
        id: 'first_lab',
        title: 'First Steps',
        description: 'Complete your first lab',
        icon: '🎯',
        earned: completedLabs >= 1,
        earnedAt: completedLabs >= 1 ? 'Check your first completed lab' : null
      },
      {
        id: 'lab_novice',
        title: 'Lab Novice',
        description: 'Complete 5 labs',
        icon: '⭐',
        earned: completedLabs >= 5,
        earnedAt: completedLabs >= 5 ? 'After completing 5 labs' : null
      },
      {
        id: 'lab_expert',
        title: 'Lab Expert',
        description: 'Complete 20 labs',
        icon: '🏆',
        earned: completedLabs >= 20,
        earnedAt: completedLabs >= 20 ? 'After completing 20 labs' : null
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Complete a lab with 100% score',
        icon: '💯',
        earned: user.stats.averageScore >= 95 && completedLabs > 0,
        earnedAt: user.stats.averageScore >= 95 ? 'Achieved through high performance' : null
      },
      {
        id: 'routing_master',
        title: 'Routing Master',
        description: 'Complete 10 routing labs',
        icon: '🌐',
        earned: false, // Would need specific tracking
        earnedAt: null
      },
      {
        id: 'troubleshooting_guru',
        title: 'Troubleshooting Guru',
        description: 'Complete 10 troubleshooting labs',
        icon: '🔧',
        earned: false, // Would need specific tracking
        earnedAt: null
      }
    ];

    const earnedCount = achievements.filter(a => a.earned).length;

    res.status(200).json({
      success: true,
      data: {
        achievements,
        earnedCount,
        totalAchievements: achievements.length,
        completionPercentage: Math.round((earnedCount / achievements.length) * 100)
      }
    });
  } catch (error) {
    logger.error(`Get achievements error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching achievements'
    });
  }
});

// @desc    Get user's skill progression
// @route   GET /api/users/skills
// @access  Private
router.get('/skills', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get skill-specific progress
    const skillProgress = await Progress.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      {
        $lookup: {
          from: 'labs',
          localField: 'lab',
          foreignField: '_id',
          as: 'labInfo'
        }
      },
      { $unwind: '$labInfo' },
      {
        $group: {
          _id: '$labInfo.category',
          completedLabs: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalTime: { $sum: '$duration' }
        }
      }
    ]);

    // Combine with user's skill levels
    const skills = ['routing', 'switching', 'security', 'troubleshooting', 'network-design'];
    const skillData = skills.map(skill => {
      const progress = skillProgress.find(sp => sp._id === skill);
      const userSkill = user.stats.skills.find(s => s.skill === skill);
      
      return {
        skill,
        level: userSkill?.level || 0,
        completedLabs: progress?.completedLabs || 0,
        averageScore: Math.round(progress?.averageScore || 0),
        totalTime: progress?.totalTime || 0,
        nextLevel: Math.min((userSkill?.level || 0) + 20, 100)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        skills: skillData,
        overallLevel: Math.round(skillData.reduce((sum, s) => sum + s.level, 0) / skillData.length)
      }
    });
  } catch (error) {
    logger.error(`Get skills error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching skills'
    });
  }
});

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || 'all-time'; // week, month, all-time

    let dateFilter = {};
    if (timeframe === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'progresses',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                status: 'completed',
                ...dateFilter
              }
            }
          ],
          as: 'recentProgress'
        }
      },
      {
        $addFields: {
          recentStats: {
            completedLabs: { $size: '$recentProgress' },
            averageScore: { $avg: '$recentProgress.score' },
            totalPoints: { $sum: '$recentProgress.pointsEarned' }
          }
        }
      },
      {
        $addFields: {
          leaderboardScore: {
            $add: [
              { $multiply: ['$recentStats.completedLabs', 100] },
              { $multiply: ['$recentStats.averageScore', 10] },
              '$recentStats.totalPoints'
            ]
          }
        }
      },
      { $match: { leaderboardScore: { $gt: 0 } } },
      {
        $project: {
          username: 1,
          'profile.firstName': 1,
          'profile.lastName': 1,
          'stats.labsCompleted': 1,
          'stats.averageScore': 1,
          leaderboardScore: 1,
          recentStats: 1
        }
      },
      { $sort: { leaderboardScore: -1 } },
      { $limit: limit }
    ]);

    // Add ranks
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        timeframe,
        userRank: rankedLeaderboard.findIndex(u => u._id.toString() === req.user.id) + 1
      }
    });
  } catch (error) {
    logger.error(`Get leaderboard error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard'
    });
  }
});

// @desc    Update user skills (admin only)
// @route   PUT /api/users/:id/skills
// @access  Private (Admin)
router.put('/:id/skills', protect, authorize('admin'), async (req, res) => {
  try {
    const { skills } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { 'stats.skills': skills } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User skills updated successfully',
      data: user.stats.skills
    });
  } catch (error) {
    logger.error(`Update user skills error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user skills'
    });
  }
});

module.exports = router;
