const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Financial = require('../models/Financial');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// POST /api/payments/create-checkout-session
// Creates a Stripe Checkout session for a financial record
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.body;

    const record = await Financial.findById(recordId).populate('member', 'name email');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.isPaid) return res.status(400).json({ message: 'This record has already been paid' });

    // Only allow the member themselves or an admin to pay
    const isAdmin = req.user.role === 'admin' || req.user.role === 'board_member';
    if (!isAdmin && record.member?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay this record' });
    }

    // Get or create Stripe customer
    let user = await User.findById(req.user.id);
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `HOA ${record.category.charAt(0).toUpperCase() + record.category.slice(1)}`,
              description: record.description,
            },
            unit_amount: Math.round(record.amount * 100), // cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${CLIENT_URL}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/payments?canceled=true`,
      metadata: {
        recordId: record._id.toString(),
        userId: req.user.id,
      },
    });

    // Save session ID to record so we can match on webhook
    record.stripeSessionId = session.id;
    await record.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to create payment session' });
  }
});

// GET /api/payments/pending
// Returns unpaid financial records for the logged-in user (or all for admins)
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'board_member';
    const filter = { isPaid: false, type: 'income' };
    if (!isAdmin) filter.member = req.user.id;
    const records = await Financial.find(filter)
      .populate('member', 'name email unit')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/payments/history
// Returns paid records for the logged-in user (or all for admins)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'board_member';
    const filter = { isPaid: true };
    if (!isAdmin) filter.member = req.user.id;
    const records = await Financial.find(filter)
      .populate('member', 'name email unit')
      .sort({ paidDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/payments/webhook
// Stripe webhook — must be registered BEFORE express.json() middleware in index.js
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const record = await Financial.findOne({ stripeSessionId: session.id });
      if (record) {
        record.isPaid = true;
        record.paidDate = new Date();
        record.stripePaymentId = session.payment_intent;
        await record.save();
        console.log(`Payment confirmed for record ${record._id}`);
      }
    } catch (err) {
      console.error('Error updating payment record:', err);
    }
  }

  res.json({ received: true });
});

// POST /api/payments/create-payment-request (admin only)
// Admins create a new unpaid financial record (payment request) for a member
router.post('/create-payment-request', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { memberId, amount, category, description, dueDate } = req.body;
    const record = await Financial.create({
      type: 'income',
      category: category || 'dues',
      amount,
      description,
      date: dueDate || new Date(),
      member: memberId,
      isPaid: false,
    });
    await record.populate('member', 'name email unit');
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
