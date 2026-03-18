const express = require('express');
const Financial = require('../models/Financial');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/financials
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'homeowner' ? { member: req.user.id } : {};
    const { type, category } = req.query;
    if (type) filter.type = type;
    if (category) filter.category = category;
    const records = await Financial.find(filter).populate('member', 'name unit').sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/financials/summary
router.get('/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [income, expenses] = await Promise.all([
      Financial.aggregate([{ $match: { type: 'income' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Financial.aggregate([{ $match: { type: 'expense' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({
      totalIncome: income[0]?.total || 0,
      totalExpenses: expenses[0]?.total || 0,
      balance: (income[0]?.total || 0) - (expenses[0]?.total || 0),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/financials
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const record = await Financial.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/financials/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const record = await Financial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
