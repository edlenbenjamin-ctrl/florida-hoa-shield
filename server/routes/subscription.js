const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const PLANS = require('../config/plans');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

async function getOrCreateCustomer(user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

// ─────────────────────────────────────────────
// GET /api/subscription/plans — public
// ─────────────────────────────────────────────
router.get('/plans', (req, res) => {
  res.json(Object.values(PLANS));
});

// ─────────────────────────────────────────────
// GET /api/subscription/current — authenticated
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST /api/subscription/create-checkout — admin
// Creates a Stripe Checkout session for recurring subscription
// ─────────────────────────────────────────────
router.post('/create-checkout', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { plan: planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ message: 'Invalid plan' });

    const user = await User.findById(req.user.id);
    const customerId = await getOrCreateCustomer(user);

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Florida HOA Shield — ${plan.name}`,
              description: plan.maxUnits
                ? `Up to ${plan.maxUnits} units · Monthly subscription`
                : 'Unlimited units · Monthly subscription',
            },
            unit_amount: plan.price * 100,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${CLIENT_URL}/dashboard?subscription=success&plan=${planId}`,
      cancel_url: `${CLIENT_URL}/pricing`,
      metadata: { userId: user._id.toString(), plan: planId },
      subscription_data: {
        metadata: { userId: user._id.toString(), plan: planId },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Subscription checkout error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to create checkout session' });
  }
});

// ─────────────────────────────────────────────
// POST /api/subscription/billing-portal — admin
// Opens the Stripe Customer Portal to manage/cancel subscription
// ─────────────────────────────────────────────
router.post('/billing-portal', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${CLIENT_URL}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to open billing portal' });
  }
});

// ─────────────────────────────────────────────
// POST /api/subscription/webhook — Stripe events
// ─────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Subscription webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const { type, data } = event;

    if (type === 'checkout.session.completed') {
      const session = data.object;
      if (session.mode !== 'subscription') return res.json({ received: true });
      const { userId, plan } = session.metadata || {};
      if (userId && plan) {
        await User.findByIdAndUpdate(userId, {
          plan,
          subscriptionStatus: 'active',
          stripeSubscriptionId: session.subscription,
        });
        console.log(`Subscription activated: user=${userId} plan=${plan}`);
      }
    }

    if (type === 'customer.subscription.updated') {
      const sub = data.object;
      const userId = sub.metadata?.userId;
      const plan = sub.metadata?.plan;
      if (userId) {
        const statusMap = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'past_due',
        };
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: statusMap[sub.status] || sub.status,
          ...(plan ? { plan } : {}),
        });
      }
    }

    if (type === 'customer.subscription.deleted') {
      const sub = data.object;
      const userId = sub.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        });
        console.log(`Subscription canceled: user=${userId}`);
      }
    }

    if (type === 'invoice.payment_failed') {
      const invoice = data.object;
      const customerId = invoice.customer;
      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        await User.findByIdAndUpdate(user._id, { subscriptionStatus: 'past_due' });
        console.log(`Payment failed: user=${user._id}`);
      }
    }
  } catch (err) {
    console.error('Error handling subscription event:', err);
  }

  res.json({ received: true });
});

module.exports = router;
