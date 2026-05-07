const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// Get uploaded curriculum files from file system
const getCurriculumFiles = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads/documents');
    console.log('Curriculum route - uploadsDir:', uploadsDir);
    console.log('Curriculum route - __dirname:', __dirname);
    
    if (!fs.existsSync(uploadsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(uploadsDir)
      .filter(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return stats.isFile() && (
          file.toLowerCase().includes('curriculum') || 
          file.toLowerCase().includes('network') ||
          file.toLowerCase().includes('routing') ||
          file.toLowerCase().includes('security') ||
          file.toLowerCase().includes('wan') ||
          file.toLowerCase().includes('spanning') ||
          file.toLowerCase().includes('fusion') ||
          file.toLowerCase().includes('acl') ||
          file.toLowerCase().includes('cloud')
        );
      })
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        const fileExt = path.extname(file).toLowerCase();
        
        return {
          id: `curriculum-${file.replace(/\.[^/.]+$/, '')}`,
          title: file.replace(/\.[^/.]+$/, ""),
          description: `Uploaded curriculum document: ${file}`,
          category: 'comprehensive',
          level: 'beginner',
          estimatedDuration: 60,
          fileName: file,
          fileSize: stats.size,
          tags: ['curriculum', 'comprehensive'],
          enrolledCount: 0,
          rating: 4.5,
          uploadedAt: stats.mtime.toISOString(),
          filePath: filePath
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    console.log(`Found ${files.length} curriculum files in uploads directory`);
    return files;
  } catch (error) {
    console.error('Error fetching curriculum files:', error);
    return [];
  }
};

// Shared file service function - metadata only (no live streams)
const getFileMetadata = (id) => {
  const fs = require('fs');
  const path = require('path');
  
  const curriculum = getCurriculumFiles().find(item => item.id === id);
  
  if (!curriculum || !fs.existsSync(curriculum.filePath)) {
    return null;
  }
  
  // CRITICAL: Validate file path to prevent directory traversal
  const baseDir = path.resolve(path.join(__dirname, '../uploads'));
  const normalizedPath = path.normalize(curriculum.filePath);
  const absolutePath = path.resolve(baseDir, normalizedPath);
  
  if (!absolutePath.startsWith(baseDir)) {
    logger.error('Security: Path traversal attempt blocked', {
      filePath: curriculum.filePath,
      normalizedPath,
      attemptedPath: absolutePath
    });
    return null;
  }
  
  // Determine content type based on file extension
  const ext = path.extname(curriculum.fileName).toLowerCase();
  let contentType = 'application/octet-stream';
  
  switch (ext) {
    case '.pdf':
      contentType = 'application/pdf';
      break;
    case '.docx':
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;
    case '.doc':
      contentType = 'application/msword';
      break;
    case '.xlsx':
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    case '.xls':
      contentType = 'application/vnd.ms-excel';
      break;
    case '.pptx':
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      break;
    case '.ppt':
      contentType = 'application/vnd.ms-powerpoint';
      break;
    case '.txt':
      contentType = 'text/plain';
      break;
  }
  
  return {
    curriculum,
    contentType,
    filePath: absolutePath, // Use validated absolute path
    fileName: curriculum.fileName,
    fileSize: fs.statSync(absolutePath).size
  };
};

// @desc    Get all curriculum documents
// @route   GET /api/curriculum
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search = '', category = 'all', level = 'all', sort = 'newest' } = req.query;
    
    let filteredData = await getCurriculumFiles();
    
    // Filter by search term
    if (search) {
      filteredData = filteredData.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Filter by category
    if (category !== 'all') {
      filteredData = filteredData.filter(item => item.category === category);
    }
    
    // Filter by level
    if (level !== 'all') {
      filteredData = filteredData.filter(item => item.level === level);
    }
    
    // Sort results
    switch (sort) {
      case 'newest':
        filteredData.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'oldest':
        filteredData.sort((a, b) => a.id.localeCompare(b.id));
        break;
      case 'title':
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'difficulty':
        const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        filteredData.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
        break;
    }
    
    logger.info(`Curriculum fetched: ${filteredData.length} items`);
    
    res.status(200).json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });
  } catch (error) {
    logger.error(`Get curriculum error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch curriculum'
    });
  }
});

// @desc    Download curriculum document
// @route   GET /api/curriculum/:id/download
// @access  Public
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use shared metadata service
    const fileMeta = getFileMetadata(id);
    
    if (!fileMeta) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum document not found'
      });
    }
    
    logger.info(`Curriculum download requested: ${fileMeta.curriculum.title}`);
    
    // Create our own stream to avoid sharing issues
    const fs = require('fs');
    const fileStream = fs.createReadStream(fileMeta.filePath);
    
    // Handle stream errors
    fileStream.on('error', (error) => {
      logger.error(`File stream error during download: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to read file'
        });
      }
    });
    
    // Handle client disconnect to prevent resource waste (more reliable than req.on)
    res.on('close', () => {
      if (!res.writableEnded) {
        fileStream.destroy();
        logger.info(`Client disconnected during download: ${fileMeta.curriculum.title}`);
      }
    });
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.fileName}"`);
    res.setHeader('Content-Length', fileMeta.fileSize);
    
    // Stream the file to the response with backpressure protection
    fileStream.pipe(res, { end: true });
    
    // Add backpressure handling for large files
    fileStream.on('data', (chunk) => {
      if (!res.write(chunk)) {
        fileStream.pause();
        res.once('drain', () => fileStream.resume());
      }
    });
  } catch (error) {
    logger.error(`Curriculum download error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to download curriculum'
    });
  }
});

// @desc    View curriculum document content (converts to HTML for inline viewing)
// @route   GET /api/curriculum/:id/view
// @access  Public
router.get('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = getCurriculumFiles().find(item => item.id === id);
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum document not found'
      });
    }
    
    // Try to read file content and convert to HTML
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = curriculum.filePath;
      
      if (fs.existsSync(filePath)) {
        const fileExt = path.extname(filePath).toLowerCase();
        let content = '';
        
        // Handle different file types
        if (fileExt === '.txt') {
          // Read text files directly
          content = fs.readFileSync(filePath, 'utf8');
          content = `<div style="padding: 20px; font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;"><h2 style="color: #333; margin-bottom: 20px; text-align: center;">${curriculum.title}</h2><div style="background: #ffffff; padding: 30px; border-radius: 8px; line-height: 1.6; border: 1px solid #e5e7eb; color: #333; white-space: pre-wrap;">${content}</div></div>`;
        } else if (fileExt === '.docx') {
          // Extract text and images from .docx files using mammoth
          try {
            const mammoth = require('mammoth');
            const result = await mammoth.convertToHtml({path: filePath});
            let htmlContent = result.value || '';
            
            if (typeof htmlContent !== 'string') {
              throw new Error('Mammoth did not return HTML content');
            }
            
            // Process images in the HTML to make them displayable
            htmlContent = htmlContent.replace(/src="data:image\/([^;]+);base64,([^"]+)"/g, (match, p1, p2, p3) => {
              const imageType = p1;
              const base64Data = p3;
              return `src="data:image/${imageType};base64,${base64Data}"`;
            });
            
            content = `
              <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;">
                <h2 style="color: #333; margin-bottom: 20px; text-align: center;">${curriculum.title}</h2>
                <div style="background: #ffffff; padding: 30px; border-radius: 8px; line-height: 1.6; border: 1px solid #e5e7eb; color: #333;">
                  ${htmlContent.replace(/color:\s*#[0-9a-fA-F]{3,6}/g, 'color: #333').replace(/color:\s*white/g, 'color: #333').replace(/color:\s*rgb\(255,\s*255,\s*255\)/g, 'color: #333')}
                </div>
                <div style="margin-top: 30px; text-align: center;">
                  <button onclick="window.open('/api/curriculum/${curriculum.id}/download', '_blank')" 
                          style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    Download Original Document
                  </button>
                </div>
                <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                  <p>Document generated from ${curriculum.fileName}</p>
                  <p>Images and formatting preserved from original document</p>
                </div>
              </div>
            `;
            logger.info(`Successfully extracted DOCX content for: ${curriculum.title}`);
          } catch (err) {
            logger.error(`Error reading DOCX file: ${err.message}`);
            content = `
              <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h2>Document Preview</h2>
                <p>Unable to read DOCX file.</p>
                <button onclick="window.open('/api/curriculum/${curriculum.id}/download', '_blank')" 
                        style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  Download Document
                </button>
              </div>
            `;
          }
        } else if (fileExt === '.pdf') {
          // For PDF files, convert to base64 and embed
          try {
            const pdfData = fs.readFileSync(filePath, 'base64');
            
            content = `
              <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;">
                <h2 style="color: #333; margin-bottom: 20px; text-align: center;">${curriculum.title}</h2>
                <div style="background: #ffffff; padding: 30px; border-radius: 8px; line-height: 1.6; border: 1px solid #e5e7eb; color: #333;">
                  <iframe 
                    src="data:application/pdf;base64,${pdfData}"
                    style="width: 100%; height: 600px; border: none;"
                    title="${curriculum.title}">
                  </iframe>
                </div>
                <div style="margin-top: 30px; text-align: center;">
                  <button onclick="window.open('/api/curriculum/${curriculum.id}/download', '_blank')" 
                          style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    Download Original Document
                  </button>
                </div>
                <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                  <p>Document generated from ${curriculum.fileName}</p>
                  <p>PDF viewer with inline display</p>
                </div>
              </div>
            `;
            logger.info(`Successfully extracted PDF content for: ${curriculum.title}`);
          } catch (err) {
            logger.error(`Error reading PDF file: ${err.message}`);
            content = `
              <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h2>Document Preview</h2>
                <p>Unable to read PDF file.</p>
                <button onclick="window.open('/api/curriculum/${curriculum.id}/download', '_blank')" 
                        style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                  Download Document
                </button>
              </div>
            `;
          }
        } else {
          // For other files, provide download link
          content = `
            <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
              <h2>Document Preview</h2>
              <p>This document type (${fileExt}) cannot be displayed inline.</p>
              <p>Please download the document to view its contents.</p>
              <button onclick="window.open('/api/curriculum/${curriculum.id}/download', '_blank')" 
                      style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Download Document
              </button>
            </div>
          `;
        }
        
        logger.info(`Curriculum content requested: ${curriculum.title}`);
        
        res.status(200).json({
          success: true,
          data: {
            ...curriculum,
            content: content
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }
    } catch (error) {
      logger.error(`Curriculum view error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to read curriculum'
      });
    }
  } catch (error) {
    logger.error(`Curriculum view error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    View curriculum document in browser (serves actual file)
// @route   GET /api/curriculum/:id/view-file
// @access  Public
router.get('/:id/view-file', async (req, res) => {
  try {
    const { id } = req.params;
    // Use shared metadata service
    const fileMeta = getFileMetadata(id);
    
    if (!fileMeta) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum document not found'
      });
    }
    
    logger.info(`Curriculum view requested: ${fileMeta.curriculum.title}`);
    
    // Create our own stream to avoid sharing issues
    const fs = require('fs');
    const fileStream = fs.createReadStream(fileMeta.filePath);
    
    // Handle stream errors
    fileStream.on('error', (error) => {
      logger.error(`File stream error during view: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to read file'
        });
      }
    });
    
    // Handle client disconnect to prevent resource waste (more reliable than req.on)
    res.on('close', () => {
      if (!res.writableEnded) {
        fileStream.destroy();
        logger.info(`Client disconnected during view: ${fileMeta.curriculum.title}`);
      }
    });
    
    // Set headers for inline viewing
    res.setHeader('Content-Type', fileMeta.contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', fileMeta.fileSize);
    
    // Stream the file to the response with backpressure protection
    fileStream.pipe(res, { end: true });
    
    // Add backpressure handling for large files
    fileStream.on('data', (chunk) => {
      if (!res.write(chunk)) {
        fileStream.pause();
        res.once('drain', () => fileStream.resume());
      }
    });
  } catch (error) {
    logger.error(`Curriculum view error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to view curriculum'
    });
  }
});

// @desc    Serve images from .docx documents
// @route   GET /api/curriculum/:id/images/:imageName
// @access  Public
router.get('/:id/images/:imageName', async (req, res) => {
  try {
    const { id, imageName } = req.params;
    const curriculum = getCurriculumFiles().find(item => item.id === id);
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum document not found'
      });
    }
    
    const JSZip = require('jszip');
    const fs = require('fs');
    
    // Read the .docx file
    const data = fs.readFileSync(curriculum.filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Look for the image in the media folder
    let imageFound = false;
    zip.forEach((relativePath, file) => {
      if (relativePath.includes(imageName) && relativePath.includes('media/')) {
        imageFound = true;
        const imageBuffer = file.async('nodebuffer');
        imageBuffer.then(buffer => {
          const ext = relativePath.split('.').pop().toLowerCase();
          const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/gif';
          
          res.setHeader('Content-Type', contentType);
          res.send(buffer);
        });
      }
    });
    
    if (!imageFound) {
      res.status(404).json({
        success: false,
        message: 'Image not found in document'
      });
    }
  } catch (error) {
    logger.error(`Image serving error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to serve image'
    });
  }
});

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
        
        // Create a simple curriculum item object
        const storedItem = {
          id: `curriculum-${item.title.replace(/\.[^/.]+$/, '')}`,
          title: item.title,
          description: `Batch uploaded curriculum: ${item.title}`,
          category: 'comprehensive',
          level: 'beginner',
          estimatedDuration: 60,
          fileName: item.title,
          fileSize: item.size || 0,
          tags: ['curriculum', 'comprehensive'],
          enrolledCount: 0,
          rating: 4.5,
          uploadedAt: new Date().toISOString(),
          filePath: item.path || `/uploads/curriculum/${item.title}`
        };
        
        results.successful.push({
          index: i,
          title: item.title,
          id: storedItem.id
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
