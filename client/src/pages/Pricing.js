import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Pricing.css';

const FALLBACK_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    maxUnits: 50,
    color: '#1e3a5f',
    popular: false,
    features: [
      'Up to 50 units',
      'Member management',
      'Violation tracking',
      'Document storage',
      'Community announcements',
      'Online voting',
      'Payment collection',
      'Email notifications',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    maxUnits: 150,
    color: '#f0a500',
    popular: true,
    features: [
      'Up to 150 units',
      'Everything in Starter',
      'Advanced financial reports',
      'Bulk payment requests',
      'Priority email support',
      'Custom announcement categories',
      'Voting analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    maxUnits: null,
    color: '#27ae60',
    popular: false,
    features: [
      'Unlimited units',
      'Everything in Growth',
      'Dedicated account manager',
      'Phone support',
      'Custom branding',
      'API access',
      'White-label option',
      'SLA guarantee',
    ],
  },
];

const PricingCard = ({ plan, onSelect, currentPlan, upgrading }) => {
  const isCurrent = currentPlan === plan.id;
  const isLoading = upgrading === plan.id;

  return (
    <div className={`pricing-card ${plan.popular ? 'popular' : ''}`} style={{ borderTopColor: plan.color }}>
      {plan.popular && <span className="popular-badge">Most Popular</span>}

      <div className="plan-name" style={{ color: plan.color }}>
        {plan.name}
      </div>

      <div className="plan-price">
        <span className="dollar">$</span>
        <span className="amount">{plan.price}</span>
        <span className="period">/mo</span>
      </div>

      <div className="plan-unit-limit">
        {plan.maxUnits ? `Up to ${plan.maxUnits} units` : 'Unlimited units'}
      </div>

      <div className="plan-divider" />

      <ul className="plan-features">
        {plan.features.map((f, i) => (
          <li key={i}>
            <span className="feature-check" style={{ background: plan.color }}>
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <button className="plan-cta" style={{ background: '#ccc' }} disabled>
          Current Plan
        </button>
      ) : (
        <button
          className="plan-cta"
          style={{ background: plan.color, opacity: isLoading ? 0.7 : 1 }}
          onClick={() => onSelect(plan.id)}
          disabled={isLoading || !!upgrading}
        >
          {isLoading ? 'Redirecting to checkout...' : 'Get Started — Free 14-day Trial'}
        </button>
      )}
    </div>
  );
};

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    api.get('/subscription/plans').then((res) => setPlans(res.data)).catch(() => {});
    if (user) {
      api.get('/subscription/current').then((res) => setCurrentPlan(res.data.plan)).catch(() => {});
    }
  }, [user]);

  const [upgrading, setUpgrading] = useState(null);

  const handleSelect = async (planId) => {
    if (user) {
      // Logged-in admin: create Stripe checkout session
      try {
        setUpgrading(planId);
        const res = await api.post('/subscription/create-checkout', { plan: planId });
        window.location.href = res.data.url;
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to start checkout. Is STRIPE_SECRET_KEY set?');
        setUpgrading(null);
      }
    } else {
      // Not logged in: go to register with plan pre-selected
      navigate(`/register?plan=${planId}`);
    }
  };

  return (
    <div className="pricing-page">
      {/* Top nav */}
      <nav className="pricing-nav">
        <Link to="/" className="pricing-nav-brand">Florida HOA Shield</Link>
        <div className="pricing-nav-links">
          {user ? (
            <Link to="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register" className="btn-outline">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="pricing-hero">
        <div className="pricing-hero-logo">Florida HOA Shield</div>
        <h1>
          Simple pricing for <span>every HOA</span>
        </h1>
        <p>
          Professional HOA management software trusted by Florida communities.
          Start with a free 14-day trial — no credit card required.
        </p>
        <span className="pricing-trial-badge">14-day free trial on all plans</span>
      </div>

      {/* Plan cards */}
      <div className="pricing-grid">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelect}
            currentPlan={currentPlan}
            upgrading={upgrading}
          />
        ))}
      </div>

      {/* Trust indicators */}
      <div className="pricing-guarantee">
        <div className="guarantee-item">
          <span className="guarantee-icon">🔒</span>
          <span>Bank-level security with Stripe</span>
        </div>
        <div className="guarantee-item">
          <span className="guarantee-icon">✉️</span>
          <span>Cancel anytime, no contracts</span>
        </div>
        <div className="guarantee-item">
          <span className="guarantee-icon">⚡</span>
          <span>Set up in under 10 minutes</span>
        </div>
        <div className="guarantee-item">
          <span className="guarantee-icon">🏖️</span>
          <span>Built for Florida communities</span>
        </div>
      </div>

      {/* Footer note */}
      <div className="pricing-footer">
        <p>
          All plans include a 14-day free trial. Questions?{' '}
          <a href="mailto:hello@floridahoashield.com">Contact us</a> — we're happy to help.
        </p>
        <p style={{ marginTop: 8 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Pricing;
