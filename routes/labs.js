const express = require('express');
const Lab = require('../models/Lab');
const Progress = require('../models/Progress');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// @desc    Get all labs with filtering and pagination
// @route   GET /api/labs
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by difficulty
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sort options
    const sortOptions = {};
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'desc' ? -1 : 1;
      sortOptions[sortField] = sortOrder;
    } else {
      sortOptions.createdAt = -1;
    }

    // Execute query
    const labs = await Lab.find(query)
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-solution -tasks.commands -tasks.hints');

    const total = await Lab.countDocuments(query);

    res.status(200).json({
      success: true,
      count: labs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: labs.map(lab => lab.getSummary())
    });
  } catch (error) {
    logger.error(`Get labs error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching labs'
    });
  }
});

// @desc    Get single lab by ID
// @route   GET /api/labs/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id)
      .populate('createdBy', 'username profile.firstName profile.lastName');

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Don't return solution and hints for non-authenticated users or students
    let labData = lab.toObject();
    
    if (!req.user || req.user.role === 'student') {
      labData.tasks = labData.tasks.map(task => ({
        ...task,
        hints: []
      }));
      delete labData.solution;
    }

    res.status(200).json({
      success: true,
      data: labData
    });
  } catch (error) {
    logger.error(`Get lab error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lab'
    });
  }
});

// @desc    Create new lab
// @route   POST /api/labs
// @access  Private (Instructor/Admin)
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const labData = {
      ...req.body,
      createdBy: req.user.id
    };

    const lab = await Lab.create(labData);

    const populatedLab = await Lab.findById(lab._id)
      .populate('createdBy', 'username profile.firstName profile.lastName');

    logger.info(`New lab created: ${lab.title} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Lab created successfully',
      data: populatedLab
    });
  } catch (error) {
    logger.error(`Create lab error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while creating lab'
    });
  }
});

// @desc    Update lab
// @route   PUT /api/labs/:id
// @access  Private (Instructor/Admin or Lab Creator)
router.put('/:id', protect, async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' || 
        (req.user.role === 'instructor' && lab.createdBy.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lab'
      });
    }

    const updatedLab = await Lab.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username profile.firstName profile.lastName');

    logger.info(`Lab updated: ${updatedLab.title} by ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Lab updated successfully',
      data: updatedLab
    });
  } catch (error) {
    logger.error(`Update lab error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lab'
    });
  }
});

// @desc    Delete lab
// @route   DELETE /api/labs/:id
// @access  Private (Instructor/Admin or Lab Creator)
router.delete('/:id', protect, async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' || 
        (req.user.role === 'instructor' && lab.createdBy.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lab'
      });
    }

    await Lab.findByIdAndDelete(req.params.id);

    logger.info(`Lab deleted: ${lab.title} by ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete lab error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting lab'
    });
  }
});

// @desc    Get lab categories
// @route   GET /api/labs/categories/list
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Lab.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`Get categories error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @desc    Get user's lab progress
// @route   GET /api/labs/:id/progress
// @access  Private
router.get('/:id/progress', protect, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.id,
      lab: req.params.id
    }).populate('lab', 'title difficulty duration');

    if (!progress) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: progress.getSummary()
    });
  } catch (error) {
    logger.error(`Get progress error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching progress'
    });
  }
});

// @desc    Rate a lab
// @route   POST /api/labs/:id/rating
// @access  Private
router.post('/:id/rating', protect, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Update rating
    const currentTotal = lab.rating.average * lab.rating.count;
    const newCount = lab.rating.count + 1;
    const newAverage = (currentTotal + rating) / newCount;

    lab.rating.average = Math.round(newAverage * 10) / 10;
    lab.rating.count = newCount;

    await lab.save();

    res.status(200).json({
      success: true,
      message: 'Lab rated successfully',
      data: {
        average: lab.rating.average,
        count: lab.rating.count
      }
    });
  } catch (error) {
    logger.error(`Rate lab error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while rating lab'
    });
  }
});

// @desc    Get featured labs
// @route   GET /api/labs/featured
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const labs = await Lab.find({ isActive: true })
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(6)
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .select('-solution -tasks.commands -tasks.hints');

    res.status(200).json({
      success: true,
      data: labs.map(lab => lab.getSummary())
    });
  } catch (error) {
    logger.error(`Get featured labs error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured labs'
    });
  }
});

// @desc    Batch upload labs (JSON array)
// @route   POST /api/labs/batch
// @access  Private (Instructor/Admin)
router.post('/batch', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { labsData } = req.body;

    if (!Array.isArray(labsData)) {
      return res.status(400).json({
        success: false,
        message: 'Labs data must be an array'
      });
    }

    const results = {
      successful: [],
      failed: [],
      total: labsData.length
    };

    // Get admin user for createdBy
    let adminUser = await require('../models/User').findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = req.user;
    }

    for (let i = 0; i < labsData.length; i++) {
      try {
        const labItem = labsData[i];
        const labData = {
          ...labItem,
          createdBy: adminUser._id
        };

        const lab = await Lab.create(labData);
        results.successful.push({
          index: i,
          title: labItem.title,
          id: lab._id
        });

        logger.info(`Batch upload - Lab created: ${labItem.title}`);
      } catch (error) {
        results.failed.push({
          index: i,
          title: labsData[i].title,
          error: error.message
        });
        logger.error(`Batch upload error - ${labsData[i].title}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Batch upload completed: ${results.successful.length}/${results.total} successful`,
      data: results
    });
  } catch (error) {
    logger.error(`Batch upload labs error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during batch upload'
    });
  }
});

module.exports = router;
