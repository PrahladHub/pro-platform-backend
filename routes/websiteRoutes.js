const express = require('express');
const router = express.Router();

const Website = require('../models/Website');
const { protect } = require('../middleware/auth');

// =====================================================
// HELPER: CREATE UNIQUE SLUG
// =====================================================

const createUniqueSlug = async (name, providedSlug = '') => {
  let baseSlug =
    providedSlug ||
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  if (!baseSlug) {
    baseSlug = 'my-website';
  }

  let slug = baseSlug;
  let counter = 1;

  while (await Website.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// =====================================================
// GET ALL WEBSITES
// =====================================================

router.get('/', protect, async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const websites = await Website.find({
      storeId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: websites.length,
      websites,
    });
  } catch (error) {
    console.error('Get websites error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load websites',
    });
  }
});

// =====================================================
// CREATE WEBSITE
// =====================================================

router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      domain,
      description,
      category,
      slug,
    } = req.body;

    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Website name is required',
      });
    }

    const websiteSlug = await createUniqueSlug(
      name,
      slug
    );

    const website = await Website.create({
      name: name.trim(),

      domain: domain
        ? domain.trim()
        : '',

      description: description
        ? description.trim()
        : '',

      category: category || 'E-commerce',

      slug: websiteSlug,

      storeId,

      status: 'Draft',

      products: 0,

      orders: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Website created successfully',
      website,
    });
  } catch (error) {
    console.error('Create website error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create website',
    });
  }
});

// =====================================================
// GET SINGLE WEBSITE
// =====================================================

router.get('/:id', protect, async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      storeId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    return res.status(200).json({
      success: true,
      website,
    });
  } catch (error) {
    console.error('Get website error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load website',
    });
  }
});

// =====================================================
// EDIT / UPDATE WEBSITE
// =====================================================

router.put('/:id', protect, async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const {
      name,
      domain,
      description,
      category,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Website name is required',
      });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      storeId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    website.name = name.trim();

    website.domain = domain
      ? domain.trim()
      : '';

    website.description = description
      ? description.trim()
      : '';

    website.category =
      category || website.category;

    await website.save();

    return res.status(200).json({
      success: true,
      message: 'Website updated successfully',
      website,
    });
  } catch (error) {
    console.error('Update website error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update website',
    });
  }
});

// =====================================================
// PUBLISH WEBSITE
// =====================================================

router.put('/:id/publish', protect, async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      storeId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    website.status = 'Published';

    await website.save();

    return res.status(200).json({
      success: true,
      message: 'Website published successfully',
      website,
    });
  } catch (error) {
    console.error('Publish website error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish website',
    });
  }
});

// =====================================================
// UNPUBLISH WEBSITE
// =====================================================

router.put('/:id/unpublish', protect, async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      storeId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    website.status = 'Draft';

    await website.save();

    return res.status(200).json({
      success: true,
      message: 'Website unpublished successfully',
      website,
    });
  } catch (error) {
    console.error('Unpublish website error:', error);

    return res.status(500).json({
      success: false,
      message:
        error.message || 'Failed to unpublish website',
    });
  }
});

// =====================================================
// DELETE WEBSITE
// =====================================================

router.delete('/:id', protect, async (req, res) => {
  try {
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'No store found for this user',
      });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      storeId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    await Website.deleteOne({
      _id: req.params.id,
      storeId,
    });

    return res.status(200).json({
      success: true,
      message: 'Website deleted successfully',
    });
  } catch (error) {
    console.error('Delete website error:', error);

    return res.status(500).json({
      success: false,
      message:
        error.message || 'Failed to delete website',
    });
  }
});

module.exports = router;