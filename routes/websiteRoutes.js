const express = require('express');
const router = express.Router();

const Website = require('../models/Website');
const Store = require('../models/Store');
const { protect } = require('../middleware/auth');

// ============================================
// CREATE UNIQUE SLUG
// ============================================
const createUniqueSlug = async (name, providedSlug = '') => {
  const baseSlug =
    (providedSlug || name || 'website')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'website';

  let slug = baseSlug;
  let counter = 1;

  while (await Website.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// ============================================
// PUBLIC WEBSITE BY STORE SLUG
// ============================================
router.get('/public/:storeSlug', async (req, res) => {
  try {
    const storeSlug = req.params.storeSlug
      .toString()
      .trim()
      .toLowerCase();

    const store = await Store.findOne({
      slug: storeSlug,
      isActive: true,
    }).select('_id name slug');

    if (!store) {
      return res.status(404).json({
        message: 'Store not found',
      });
    }

    const website = await Website.findOne({
      storeId: store._id,
      status: 'Published',
    }).select(
      'name slug domain description category status storeId design'
    );

    if (!website) {
      return res.status(404).json({
        message: 'Published website not found',
      });
    }

    res.json({
      website,
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
      },
    });
  } catch (error) {
    console.error('Get public website error:', error);

    res.status(500).json({
      message: 'Failed to fetch public website',
      error: error.message,
    });
  }
});

// ============================================
// GET ALL WEBSITES
// ============================================
router.get('/', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const websites = await Website.find({
      storeId: req.user.storeId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      websites,
    });
  } catch (error) {
    console.error('Get websites error:', error);

    res.status(500).json({
      message: 'Failed to fetch websites',
      error: error.message,
    });
  }
});

// ============================================
// CREATE WEBSITE
// ============================================
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const {
      name,
      slug,
      domain,
      description,
      category,
      design,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Website name is required',
      });
    }

    const uniqueSlug = await createUniqueSlug(
      name,
      slug
    );

    const website = await Website.create({
      name: name.trim(),
      slug: uniqueSlug,
      domain: domain || '',
      description: description || '',
      category: category || 'E-commerce',
      status: 'Draft',
      storeId: req.user.storeId,

      design: {
        primaryColor:
          design?.primaryColor || '#4f46e5',

        backgroundColor:
          design?.backgroundColor || '#ffffff',

        textColor:
          design?.textColor || '#111827',

        font:
          design?.font || 'Inter',
      },

      products: 0,
      orders: 0,
    });

    res.status(201).json({
      success: true,
      website,
    });
  } catch (error) {
    console.error('Create website error:', error);

    res.status(500).json({
      message: 'Failed to create website',
      error: error.message,
    });
  }
});

// ============================================
// GET SINGLE WEBSITE
// ============================================
router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const website = await Website.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
    });

    if (!website) {
      return res.status(404).json({
        message: 'Website not found',
      });
    }

    res.json({
      success: true,
      website,
    });
  } catch (error) {
    console.error('Get website error:', error);

    res.status(500).json({
      message: 'Failed to fetch website',
      error: error.message,
    });
  }
});

// ============================================
// UPDATE WEBSITE
// ============================================
router.put('/:id', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const {
      name,
      domain,
      description,
      category,
      design,
    } = req.body;

    const website = await Website.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
    });

    if (!website) {
      return res.status(404).json({
        message: 'Website not found',
      });
    }

    // ============================================
    // BASIC WEBSITE INFORMATION
    // ============================================
    if (name !== undefined) {
      const cleanName = name.toString().trim();

      if (!cleanName) {
        return res.status(400).json({
          message: 'Website name is required',
        });
      }

      website.name = cleanName;
    }

    if (domain !== undefined) {
      website.domain = domain.toString().trim();
    }

    if (description !== undefined) {
      website.description = description.toString();
    }

    if (category !== undefined) {
      website.category = category.toString();
    }

    // ============================================
    // DESIGN SETTINGS
    // ============================================
    if (!website.design) {
      website.design = {
        primaryColor: '#4f46e5',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        font: 'Inter',
      };
    }

    if (design && typeof design === 'object') {
      if (design.primaryColor !== undefined) {
        website.design.primaryColor =
          design.primaryColor;
      }

      if (design.backgroundColor !== undefined) {
        website.design.backgroundColor =
          design.backgroundColor;
      }

      if (design.textColor !== undefined) {
        website.design.textColor =
          design.textColor;
      }

      if (design.font !== undefined) {
        website.design.font =
          design.font;
      }
    }

    await website.save();

    res.json({
      success: true,
      message: 'Website updated successfully',
      website,
    });
  } catch (error) {
    console.error('Update website error:', error);

    res.status(500).json({
      message: 'Failed to update website',
      error: error.message,
    });
  }
});

// ============================================
// PUBLISH WEBSITE
// ============================================
router.put('/:id/publish', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const website = await Website.findOneAndUpdate(
      {
        _id: req.params.id,
        storeId: req.user.storeId,
      },
      {
        status: 'Published',
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!website) {
      return res.status(404).json({
        message: 'Website not found',
      });
    }

    res.json({
      success: true,
      message: 'Website published successfully',
      website,
    });
  } catch (error) {
    console.error('Publish website error:', error);

    res.status(500).json({
      message: 'Failed to publish website',
      error: error.message,
    });
  }
});

// ============================================
// UNPUBLISH WEBSITE
// ============================================
router.put('/:id/unpublish', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const website = await Website.findOneAndUpdate(
      {
        _id: req.params.id,
        storeId: req.user.storeId,
      },
      {
        status: 'Draft',
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!website) {
      return res.status(404).json({
        message: 'Website not found',
      });
    }

    res.json({
      success: true,
      message: 'Website unpublished successfully',
      website,
    });
  } catch (error) {
    console.error('Unpublish website error:', error);

    res.status(500).json({
      message: 'Failed to unpublish website',
      error: error.message,
    });
  }
});

// ============================================
// DELETE WEBSITE
// ============================================
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!req.user?.storeId) {
      return res.status(400).json({
        message: 'No store is connected to this user',
      });
    }

    const result = await Website.deleteOne({
      _id: req.params.id,
      storeId: req.user.storeId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: 'Website not found',
      });
    }

    res.json({
      success: true,
      message: 'Website deleted successfully',
    });
  } catch (error) {
    console.error('Delete website error:', error);

    res.status(500).json({
      message: 'Failed to delete website',
      error: error.message,
    });
  }
});

module.exports = router;