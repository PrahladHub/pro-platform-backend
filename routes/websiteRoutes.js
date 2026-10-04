const express = require('express');
const router = express.Router();

const Website = require('../models/Website');
const Store = require('../models/Store');
const { protect } = require('../middleware/auth');


// ----------------------------------------
// Create unique slug
// ----------------------------------------
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


// ----------------------------------------
// PUBLIC GET WEBSITE BY STORE SLUG
// ----------------------------------------
// Example:
// /api/websites/public/priya-collections-882081
//
// Store slug -> Store -> Published Website
//
// No login required.
// ----------------------------------------
router.get('/public/:storeSlug', async (req, res) => {
  try {
    const storeSlug = req.params.storeSlug
      .toString()
      .trim()
      .toLowerCase();

    // Find store using the public store slug
    const store = await Store.findOne({
      slug: storeSlug,
      isActive: true,
    }).select('_id name slug');

    if (!store) {
      return res.status(404).json({
        message: 'Store not found',
      });
    }

    // Find published website belonging to this store
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
    console.error(
      'Get public website error:',
      error
    );

    res.status(500).json({
      message: 'Failed to fetch public website',
    });
  }
});


// ----------------------------------------
// GET ALL WEBSITES
// ----------------------------------------
router.get('/', protect, async (req, res) => {
  try {
    const websites = await Website.find({
      storeId: req.user.storeId,
    }).sort({ createdAt: -1 });

    res.json(websites);
  } catch (error) {
    console.error(
      'Get websites error:',
      error
    );

    res.status(500).json({
      message: 'Failed to fetch websites',
    });
  }
});


// ----------------------------------------
// CREATE WEBSITE
// ----------------------------------------
router.post('/', protect, async (req, res) => {
  try {
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

      // Design settings
      design: {
        primaryColor:
          design?.primaryColor ||
          '#4f46e5',

        backgroundColor:
          design?.backgroundColor ||
          '#ffffff',

        textColor:
          design?.textColor ||
          '#111827',

        font:
          design?.font ||
          'Inter',
      },

      products: 0,
      orders: 0,
    });

    res.status(201).json(website);
  } catch (error) {
    console.error(
      'Create website error:',
      error
    );

    res.status(500).json({
      message: 'Failed to create website',
      error: error.message,
    });
  }
});


// ----------------------------------------
// GET SINGLE WEBSITE
// ----------------------------------------
router.get('/:id', protect, async (req, res) => {
  try {
    const website = await Website.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
    });

    if (!website) {
      return res.status(404).json({
        message: 'Website not found',
      });
    }

    res.json(website);
  } catch (error) {
    console.error(
      'Get website error:',
      error
    );

    res.status(500).json({
      message: 'Failed to fetch website',
    });
  }
});


// ----------------------------------------
// UPDATE WEBSITE
// ----------------------------------------
router.put('/:id', protect, async (req, res) => {
  try {
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


    // Basic website information
    if (name !== undefined) {
      website.name = name.trim();
    }

    if (domain !== undefined) {
      website.domain = domain;
    }

    if (description !== undefined) {
      website.description =
        description;
    }

    if (category !== undefined) {
      website.category = category;
    }


    // ----------------------------------------
    // Design settings
    // ----------------------------------------
    if (design) {
      if (
        design.primaryColor !==
        undefined
      ) {
        website.design.primaryColor =
          design.primaryColor;
      }

      if (
        design.backgroundColor !==
        undefined
      ) {
        website.design.backgroundColor =
          design.backgroundColor;
      }

      if (
        design.textColor !==
        undefined
      ) {
        website.design.textColor =
          design.textColor;
      }

      if (
        design.font !==
        undefined
      ) {
        website.design.font =
          design.font;
      }
    }


    await website.save();

    res.json({
      message:
        'Website updated successfully',
      website,
    });
  } catch (error) {
    console.error(
      'Update website error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to update website',
      error: error.message,
    });
  }
});


// ----------------------------------------
// PUBLISH WEBSITE
// ----------------------------------------
router.put(
  '/:id/publish',
  protect,
  async (req, res) => {
    try {
      const website =
        await Website.findOneAndUpdate(
          {
            _id: req.params.id,
            storeId: req.user.storeId,
          },
          {
            status: 'Published',
          },
          {
            new: true,
          }
        );

      if (!website) {
        return res.status(404).json({
          message: 'Website not found',
        });
      }

      res.json({
        message:
          'Website published successfully',
        website,
      });
    } catch (error) {
      console.error(
        'Publish website error:',
        error
      );

      res.status(500).json({
        message:
          'Failed to publish website',
      });
    }
  }
);


// ----------------------------------------
// UNPUBLISH WEBSITE
// ----------------------------------------
router.put(
  '/:id/unpublish',
  protect,
  async (req, res) => {
    try {
      const website =
        await Website.findOneAndUpdate(
          {
            _id: req.params.id,
            storeId: req.user.storeId,
          },
          {
            status: 'Draft',
          },
          {
            new: true,
          }
        );

      if (!website) {
        return res.status(404).json({
          message: 'Website not found',
        });
      }

      res.json({
        message:
          'Website unpublished successfully',
        website,
      });
    } catch (error) {
      console.error(
        'Unpublish website error:',
        error
      );

      res.status(500).json({
        message:
          'Failed to unpublish website',
      });
    }
  }
);


// ----------------------------------------
// DELETE WEBSITE
// ----------------------------------------
router.delete(
  '/:id',
  protect,
  async (req, res) => {
    try {
      const result =
        await Website.deleteOne({
          _id: req.params.id,
          storeId: req.user.storeId,
        });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: 'Website not found',
        });
      }

      res.json({
        message:
          'Website deleted successfully',
      });
    } catch (error) {
      console.error(
        'Delete website error:',
        error
      );

      res.status(500).json({
        message:
          'Failed to delete website',
      });
    }
  }
);


module.exports = router;