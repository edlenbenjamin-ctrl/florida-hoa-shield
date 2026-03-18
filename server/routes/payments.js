const express = require('express');
const crypto = require('crypto');
const Financial = require('../models/Financial');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendEmail, paymentRequestEmail, paymentReceiptEmail } = require('../services/emailService');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Add it to your .env file.');
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Helper: get or create Stripe customer for a user
async function getOrCreateStripeCustomer(user) {
  if (!user.stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }
  return user.stripeCustomerId;
}

// Helper: build a Stripe Checkout session for a financial record
async function buildCheckoutSession({ record, stripeCustomerId, memberEmail }) {
  return getStripe().checkout.sessions.create({
    ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: memberEmail }),
    payment_method_types: ['card', 'us_bank_account'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `HOA ${record.category.charAt(0).toUpperCase() + record.category.slice(1)}`,
            description: record.description,
          },
          unit_amount: Math.round(record.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${CLIENT_URL}/payments?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CLIENT_URL}/payments?canceled=true`,
    metadata: { recordId: record._id.toString() },
  });
}

// ─────────────────────────────────────────────
// PUBLIC: GET /api/payments/pay/:token
// Email payment link — no login required
// ─────────────────────────────────────────────
router.get('/pay/:token', async (req, res) => {
  try {
    const record = await Financial.findOne({
      paymentToken: req.params.token,
      paymentTokenExpiry: { $gt: new Date() },
      isPaid: false,
    }).populate('member', 'name email stripeCustomerId');

    if (!record) {
      return res.status(410).json({ message: 'This payment link is invalid or has expired.' });
    }

    const member = record.member;
    let stripeCustomerId = null;
    if (member?.stripeCustomerId) stripeCustomerId = member.stripeCustomerId;

    const session = await buildCheckoutSession({
      record,
      stripeCustomerId,
      memberEmail: member?.email,
    });

    record.stripeSessionId = session.id;
    await record.save();

    // Redirect directly to Stripe Checkout
    res.redirect(303, session.url);
  } catch (err) {
    console.error('Token pay error:', err.message);
    res.status(500).json({ message: 'Failed to start payment session' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/create-checkout-session
// Authenticated — from the portal UI
// ─────────────────────────────────────────────
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.body;

    const record = await Financial.findById(recordId).populate('member', 'name email');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.isPaid) return res.status(400).json({ message: 'This record has already been paid' });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'board_member';
    if (!isAdmin && record.member?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay this record' });
    }

    const user = await User.findById(req.user.id);
    const stripeCustomerId = await getOrCreateStripeCustomer(user);

    const session = await buildCheckoutSession({ record, stripeCustomerId });
    record.stripeSessionId = session.id;
    await record.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to create payment session' });
  }
});

// ─────────────────────────────────────────────
// GET /api/payments/pending
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/payments/history
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST /api/payments/webhook  (Stripe)
// ─────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const record = await Financial.findOne({ stripeSessionId: session.id })
        .populate('member', 'name email');

      if (record && !record.isPaid) {
        record.isPaid = true;
        record.paidDate = new Date();
        record.stripePaymentId = session.payment_intent;
        record.paymentToken = undefined;       // invalidate token after payment
        record.paymentTokenExpiry = undefined;
        await record.save();

        console.log(`Payment confirmed for record ${record._id}`);

        // Send receipt email
        const memberEmail = record.member?.email || session.customer_details?.email;
        const memberName = record.member?.name || session.customer_details?.name || 'Homeowner';
        if (memberEmail) {
          const receiptNumber = session.payment_intent?.slice(-8).toUpperCase() || record._id.toString().slice(-8).toUpperCase();
          const { subject, html } = paymentReceiptEmail({
            memberName,
            description: record.description,
            amount: record.amount,
            category: record.category,
            paidDate: record.paidDate,
            receiptNumber,
          });
          await sendEmail({ to: memberEmail, subject, html });
        }
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
    }
  }

  res.json({ received: true });
});

// ─────────────────────────────────────────────
// POST /api/payments/create-payment-request  (admin)
// Creates a payment request and emails the member a pay link
// ─────────────────────────────────────────────
router.post('/create-payment-request', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { memberId, amount, category, description, dueDate } = req.body;

    // Generate secure payment token (30-day expiry)
    const paymentToken = crypto.randomBytes(32).toString('hex');
    const paymentTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const record = await Financial.create({
      type: 'income',
      category: category || 'dues',
      amount,
      description,
      date: dueDate || new Date(),
      member: memberId,
      isPaid: false,
      paymentToken,
      paymentTokenExpiry,
    });

    await record.populate('member', 'name email unit');

    // Build direct payment URL (no login required)
    const paymentUrl = `${process.env.SERVER_URL || 'http://localhost:3001'}/api/payments/pay/${paymentToken}`;

    // Email the member
    if (record.member?.email) {
      const { subject, html } = paymentRequestEmail({
        memberName: record.member.name,
        description: record.description,
        amount: record.amount,
        category: record.category,
        dueDate: record.date,
        paymentUrl,
      });
      const sent = await sendEmail({ to: record.member.email, subject, html });
      if (!sent) {
        console.warn(`[Email] Could not send payment request to ${record.member.email} — check GMAIL_USER/GMAIL_APP_PASSWORD`);
      }
    }

    res.status(201).json({ ...record.toObject(), paymentUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/resend-email/:id  (admin)
// Re-sends the payment request email for an existing record
// ─────────────────────────────────────────────
router.post('/resend-email/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const record = await Financial.findById(req.params.id).populate('member', 'name email');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.isPaid) return res.status(400).json({ message: 'Already paid' });
    if (!record.member?.email) return res.status(400).json({ message: 'Member has no email address' });

    // Refresh or create token
    if (!record.paymentToken || record.paymentTokenExpiry < new Date()) {
      record.paymentToken = crypto.randomBytes(32).toString('hex');
      record.paymentTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await record.save();
    }

    const paymentUrl = `${process.env.SERVER_URL || 'http://localhost:3001'}/api/payments/pay/${record.paymentToken}`;
    const { subject, html } = paymentRequestEmail({
      memberName: record.member.name,
      description: record.description,
      amount: record.amount,
      category: record.category,
      dueDate: record.date,
      paymentUrl,
    });

    await sendEmail({ to: record.member.email, subject, html });
    res.json({ message: `Payment email resent to ${record.member.email}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
