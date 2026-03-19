const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PLANS = require('../config/plans');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, unit, phone, plan } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already registered' });

      // Enforce unit limit based on the HOA admin's plan
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        const adminPlan = PLANS[admin.plan] || PLANS.starter;
        if (adminPlan.maxUnits !== null) {
          const currentCount = await User.countDocuments({ isActive: true });
          if (currentCount >= adminPlan.maxUnits) {
            return res.status(403).json({
              message: `Your HOA has reached the ${adminPlan.maxUnits}-unit limit on the ${adminPlan.name} plan. Please upgrade to add more members.`,
              limitReached: true,
              currentPlan: admin.plan,
            });
          }
        }
      }

      const validPlans = ['starter', 'growth', 'pro'];
      const selectedPlan = validPlans.includes(plan) ? plan : 'starter';
      // First registered user in the system becomes the HOA admin
      const adminExists = await User.findOne({ role: 'admin' });
      const role = adminExists ? 'homeowner' : 'admin';
      const user = await User.create({ name, email, password, unit, phone, plan: selectedPlan, subscriptionStatus: 'trialing', role });
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.status(201).json({ token, user });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.json({ token, user });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
