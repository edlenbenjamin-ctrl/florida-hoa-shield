const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const PLANS = require('../config/plans');

const router = express.Router();

// GET /api/subscription/plans — public
router.get('/plans', (req, res) => {
  res.json(Object.values(PLANS));
});

// GET /api/subscription/current — authenticated
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('plan subscriptionStatus trialEndsAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const plan = PLANS[user.plan] || PLANS.starter;
    res.json({
      plan: user.plan,
      planDetails: plan,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      daysLeftInTrial:
        user.subscriptionStatus === 'trialing'
          ? Math.max(0, Math.ceil((new Date(user.trialEndsAt) - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/subscription/upgrade — admin only (simulated, no Stripe Connect yet)
router.post('/upgrade', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { plan, subscriptionStatus: 'active' },
      { new: true }
    ).select('-password');

    res.json({ message: `Upgraded to ${PLANS[plan].name} plan`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
