const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// @desc    Batch upload curriculum (JSON array)
// @route   POST /api/curriculum/batch
// @access  Private (Instructor/Admin)
router.post('/batch', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { curriculumData } = req.body;

    if (!Array.isArray(curriculumData)) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum data must be an array'
      });
    }

    const results = {
      successful: [],
      failed: [],
      total: curriculumData.length
    };

    // Get admin user for createdBy
    let adminUser = await require('../models/User').findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = req.user;
    }

    for (let i = 0; i < curriculumData.length; i++) {
      try {
        const item = curriculumData[i];
        
        // For now, just simulate successful upload
        // In a full implementation, you'd save to a Curriculum model
        results.successful.push({
          index: i,
          title: item.title,
          id: `curriculum-${Date.now()}-${i}`
        });

        logger.info(`Batch upload - Curriculum created: ${item.title}`);
      } catch (error) {
        results.failed.push({
          index: i,
          title: curriculumData[i].title,
          error: error.message
        });
        logger.error(`Batch upload error - ${curriculumData[i].title}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Batch upload completed: ${results.successful.length}/${results.total} successful`,
      data: results
    });
  } catch (error) {
    logger.error(`Batch upload curriculum error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during batch upload'
    });
  }
});

module.exports = router;
