const express = require('express');
const router = express.Router();

// ===== GET ALL WEBSITES =====
router.get('/', async (req, res) => {
  res.json({ success: true, websites: [] });
});

// ===== CREATE WEBSITE =====
router.post('/', async (req, res) => {
  const { name, slug } = req.body;
  res.json({
    success: true,
    website: {
      _id: Date.now().toString(),
      name: name || 'My Store',
      slug: slug || 'my-store',
      createdAt: new Date(),
    },
  });
});

module.exports = router;