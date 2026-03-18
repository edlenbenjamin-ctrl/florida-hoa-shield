const express = require('express');
const Announcement = require('../models/Announcement');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/announcements
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/announcements
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.create({ ...req.body, author: req.user.id });
    await announcement.populate('author', 'name');
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/announcements/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/announcements/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
