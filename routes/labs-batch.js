const express = require('express');
const Lab = require('../models/Lab');
const { protect, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

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
