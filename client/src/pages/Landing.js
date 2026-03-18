import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    maxUnits: 50,
    color: '#1e3a5f',
    popular: false,
    features: ['Up to 50 units', 'Member management', 'Violation tracking', 'Document storage', 'Online voting', 'Payment collection', 'Email notifications'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    maxUnits: 150,
    color: '#f0a500',
    popular: true,
    features: ['Up to 150 units', 'Everything in Starter', 'Advanced financial reports', 'Bulk payment requests', 'Priority email support', 'Voting analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    maxUnits: null,
    color: '#27ae60',
    popular: false,
    features: ['Unlimited units', 'Everything in Growth', 'Dedicated account manager', 'Phone support', 'Custom branding', 'API access', 'SLA guarantee'],
  },
];

const FEATURES = [
  {
    icon: '💳',
    bg: '#eaf4fd',
    title: 'Online Payment Collection',
    desc: 'Collect HOA dues, fines, and assessments online via card or bank transfer. Automatic receipts emailed to every member.',
  },
  {
    icon: '⚠️',
    bg: '#fef9e7',
    title: 'Violation Tracking',
    desc: 'Log, track, and resolve community violations with photos and history. Send automated notices to homeowners.',
  },
  {
    icon: '👥',
    bg: '#e9f7ef',
    title: 'Member Management',
    desc: 'Maintain a complete directory of homeowners with unit info, contact details, and voting rights.',
  },
  {
    icon: '📄',
    bg: '#f5eef8',
    title: 'Document Storage',
    desc: 'Store HOA documents, CC&Rs, meeting minutes, and rules in one secure, searchable place.',
  },
  {
    icon: '🗳️',
    bg: '#fde8e8',
    title: 'Community Voting',
    desc: 'Run board elections and community votes online. Real-time results with full audit trail.',
  },
  {
    icon: '📢',
    bg: '#eafaf1',
    title: 'Announcements',
    desc: 'Broadcast urgent notices, events, and community updates with priority levels and instant delivery.',
  },
];

const Landing = () => {
  return (
    <div className="landing">
      {/* ---- Nav ---- */}
      <nav className="land-nav">
        <Link to="/" className="land-nav-brand">
          Florida HOA <span>Shield</span>
        </Link>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login">Sign in</Link>
          <Link to="/register" className="land-nav-cta">Get started free</Link>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="land-hero">
        <div className="land-hero-inner">
          <div className="land-hero-eyebrow">Built for Florida Communities</div>
          <h1>
            HOA management that<br />
            actually <em>works</em>
          </h1>
          <p className="land-hero-sub">
            Collect dues, track violations, hold votes, and keep your community
            organized — all in one modern platform. Setup takes under 10 minutes.
          </p>
          <div className="land-hero-ctas">
            <Link to="/register" className="btn-hero-primary">
              Start Free 14-Day Trial
            </Link>
            <a href="#pricing" className="btn-hero-secondary">
              View Pricing
            </a>
          </div>

          <div className="land-trust">
            <div className="land-trust-item">
              <strong>50,000+</strong>
              HOAs in Florida
            </div>
            <div className="land-trust-item">
              <strong>14 days</strong>
              Free trial
            </div>
            <div className="land-trust-item">
              <strong>No</strong>
              Credit card needed
            </div>
            <div className="land-trust-item">
              <strong>Bank-level</strong>
              Security via Stripe
            </div>
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <div className="land-features-bg" id="features">
        <div className="land-section">
          <div className="land-features-header">
            <div className="land-section-label">Everything you need</div>
            <h2 className="land-section-title">One platform. Every HOA task.</h2>
            <p className="land-section-sub">
              Stop juggling spreadsheets, emails, and paper forms. Florida HOA Shield
              centralizes every workflow your board needs.
            </p>
          </div>
          <div className="land-features-grid">
            {FEATURES.map((f) => (
              <div className="land-feature-card" key={f.title}>
                <div className="land-feature-icon" style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- How it works ---- */}
      <div id="how-it-works">
        <div className="land-section">
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <div className="land-section-label">Simple onboarding</div>
            <h2 className="land-section-title">Up and running in 3 steps</h2>
          </div>
          <div className="land-steps">
            <div className="land-step">
              <div className="land-step-number">1</div>
              <h3>Create your HOA</h3>
              <p>Sign up, pick your plan, and set up your community profile. Takes less than 5 minutes.</p>
            </div>
            <div className="land-step">
              <div className="land-step-number">2</div>
              <h3>Add your members</h3>
              <p>Import your homeowner list or invite members via email. They get access instantly.</p>
            </div>
            <div className="land-step">
              <div className="land-step-number">3</div>
              <h3>Start collecting & managing</h3>
              <p>Send payment requests, post announcements, track violations — everything in one dashboard.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Pricing ---- */}
      <div className="land-pricing-bg" id="pricing">
        <div className="land-pricing-header">
          <div className="land-section-label">Transparent pricing</div>
          <h2 className="land-section-title">Simple plans, no surprises</h2>
          <p className="land-section-sub">
            Start with a 14-day free trial on any plan. No credit card required.
            Cancel anytime.
          </p>
        </div>
        <div className="land-pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`land-plan-card ${plan.popular ? 'popular' : ''}`}
              style={{ borderTopColor: plan.color }}
            >
              {plan.popular && <span className="land-popular-tag">Most Popular</span>}
              <div className="land-plan-name" style={{ color: plan.color }}>{plan.name}</div>
              <div className="land-plan-price">
                <span className="sym">$</span>
                <span className="amt">{plan.price}</span>
                <span className="per">/mo</span>
              </div>
              <div className="land-plan-units">
                {plan.maxUnits ? `Up to ${plan.maxUnits} units` : 'Unlimited units'}
              </div>
              <div className="land-plan-divider" />
              <ul className="land-plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="land-plan-check" style={{ background: plan.color }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={`/register?plan=${plan.id}`}
                className="land-plan-btn"
                style={{ background: plan.color }}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ---- CTA Banner ---- */}
      <div className="land-cta-banner">
        <h2>Ready to modernize your HOA?</h2>
        <p>Join Florida communities already using HOA Shield. No contracts, cancel anytime.</p>
        <Link to="/register" className="btn-cta-dark">
          Get started — it's free for 14 days
        </Link>
      </div>

      {/* ---- Footer ---- */}
      <footer className="land-footer">
        <p>
          © {new Date().getFullYear()} Florida HOA Shield &nbsp;·&nbsp;{' '}
          <Link to="/login">Sign in</Link> &nbsp;·&nbsp;{' '}
          <Link to="/pricing">Pricing</Link> &nbsp;·&nbsp;{' '}
          <a href="mailto:hello@floridahoashield.com">Contact</a>
        </p>
      </footer>
    </div>
  );
};

export default Landing;
