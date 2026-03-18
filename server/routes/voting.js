const express = require('express');
const Vote = require('../models/Vote');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/voting
router.get('/', authMiddleware, async (req, res) => {
  try {
    const votes = await Vote.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ endDate: 1 });
    res.json(votes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/voting
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vote = await Vote.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(vote);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/voting/:id/close
router.put('/:id/close', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vote = await Vote.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!vote) return res.status(404).json({ message: 'Vote not found' });
    res.json(vote);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/voting/:id/cast
router.post('/:id/cast', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const member = await User.findById(req.user.id);
    if (!member || !member.votingRights) return res.status(403).json({ message: 'You do not have voting rights' });

    const vote = await Vote.findById(req.params.id);
    if (!vote) return res.status(404).json({ message: 'Vote not found' });
    if (new Date() > vote.endDate) return res.status(400).json({ message: 'Voting has ended' });

    const alreadyVoted = vote.responses.some((r) => r.member.toString() === req.user.id);
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

    const { choice } = req.body;
    if (!vote.options.includes(choice)) return res.status(400).json({ message: 'Invalid choice' });

    vote.responses.push({ member: req.user.id, choice });
    await vote.save();
    res.json({ message: 'Vote cast successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/voting/:id/results
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) return res.status(404).json({ message: 'Vote not found' });

    const results = {};
    vote.options.forEach((opt) => (results[opt] = 0));
    vote.responses.forEach((r) => {
      if (results[r.choice] !== undefined) results[r.choice]++;
    });

    res.json({ title: vote.title, totalVotes: vote.responses.length, results });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
