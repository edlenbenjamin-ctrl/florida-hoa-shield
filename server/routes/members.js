const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/members
router.get('/', authMiddleware, async (req, res) => {
  try {
    const members = await User.find({ isActive: true }).select('-password');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/members/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const member = await User.findById(req.params.id).select('-password');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/members/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, phone, unit } = req.body;
    const member = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, unit },
      { new: true, runValidators: true }
    ).select('-password');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/members/:id (admin only - deactivates)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const member = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Member deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
