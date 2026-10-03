const express = require('express');
const router = express.Router();
const {
  uploadSingle,
  uploadToCloudinary,
} = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Upload single image
// @route   POST /api/upload
router.post(
  '/',
  protect,
  adminOnly,
  uploadSingle,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        'storeforge/products'
      );

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        image: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;