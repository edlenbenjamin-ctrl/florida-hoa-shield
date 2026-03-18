const express = require('express');
const Violation = require('../models/Violation');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/violations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'homeowner' ? { member: req.user.id } : {};
    const violations = await Violation.find(filter)
      .populate('member', 'name email unit')
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(violations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/violations
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const violation = await Violation.create({ ...req.body, reportedBy: req.user.id });
    await violation.populate('member', 'name email unit');
    res.status(201).json(violation);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/violations/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const violation = await Violation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('member', 'name email unit');
    if (!violation) return res.status(404).json({ message: 'Violation not found' });
    res.json(violation);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/violations/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const violation = await Violation.findByIdAndDelete(req.params.id);
    if (!violation) return res.status(404).json({ message: 'Violation not found' });
    res.json({ message: 'Violation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
