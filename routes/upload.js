const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create subdirectories based on file type
    let subDir = 'documents';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      subDir = 'documents';
    } else {
      subDir = 'other';
    }
    
    const finalDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    
    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
    files: 200, // Allow up to 200 files per request
    fieldSize: 1024 * 1024 * 1024, // 1GB for form fields
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

// @desc    Upload multiple files (bulk upload)
// @route   POST /api/upload/bulk
// @access  Private (Instructor/Admin)
router.post('/bulk', protect, authorize('instructor', 'admin'), upload.array('files', 200), async (req, res) => {
  try {
    console.log("🔥 BULK DEBUG - req.files:", req.files);
    console.log("🔥 BULK DEBUG - req.user:", req.user);
    console.log("🔥 BULK DEBUG - req.body:", req.body);
    
    if (!req.user) {
      console.log("❌ req.user missing in bulk upload route");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { type, category } = req.body;
    const results = {
      successful: [],
      failed: [],
      total: req.files.length
    };

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        // Log the upload
        logger.info(`Bulk file uploaded: ${file.originalname} by ${req.user?.username || 'unknown'}`);
        
        // Add to successful results
        results.successful.push({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          type: type || 'general',
          category: category || 'general',
          uploadedBy: req.user?.username || 'unknown',
          uploadedAt: new Date()
        });
      } catch (error) {
        logger.error(`Bulk file upload error for ${file.originalname}: ${error.message}`);
        results.failed.push({
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload completed: ${results.successful.length}/${results.total} files uploaded successfully`,
      data: results
    });
  } catch (error) {
    console.error("🔥 BULK UPLOAD FULL ERROR:", error);
    console.error("🔥 ERROR STACK:", error.stack);
    logger.error(`Bulk upload error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during bulk upload'
    });
  }
});

// @desc    Upload single file
// @route   POST /api/upload/file
// @access  Private (Instructor/Admin)
router.post('/file', protect, authorize('instructor', 'admin'), upload.single('file'), async (req, res) => {
  try {
    console.log("🔥 DEBUG - req.file:", req.file);
    console.log("🔥 DEBUG - req.user:", req.user);
    console.log("🔥 DEBUG - req.body:", req.body);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { type, category } = req.body;
    
    console.log("UPLOAD req.user =", req.user);
    
    if (!req.user) {
      console.log("❌ req.user missing in upload route");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found"
      });
    }

    const username = req.user.username;
    
    // Log the upload
    logger.info(`File uploaded: ${req.file.originalname} by ${username}`);
    
    // Return file information
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        type: type || 'general',
        category: category || 'general',
        uploadedBy: username,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error("🔥 FULL UPLOAD ERROR:", error);
    console.error("🔥 ERROR STACK:", error.stack);
    logger.error(`File upload error: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: error.message // SHOW REAL ERROR
    });
  }
});

// @desc    Get uploaded files list
// @route   GET /api/upload/files
// @access  Private (Instructor/Admin)
router.get('/files', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const files = [];
    
    // Recursively get all files
    const getFiles = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          getFiles(fullPath, relativePath);
        } else {
          const stats = fs.statSync(fullPath);
          files.push({
            name: item,
            path: relativePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          });
        }
      }
    };
    
    getFiles(uploadsDir);
    
    res.status(200).json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error(`Get files error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching files'
    });
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/upload/file/:filename
// @access  Private (Instructor/Admin)
router.delete('/file/:filename', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Find the file in uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    let filePath = null;
    
    const findFile = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          findFile(fullPath);
        } else if (item === filename) {
          filePath = fullPath;
          return;
        }
      }
    };
    
    findFile(uploadsDir);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    logger.info(`File deleted: ${filename} by ${req.user.username}`);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error(`File delete error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting file'
    });
  }
});

module.exports = router;
