import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    maxUnits: 50,
    accent: '#0B5E71',
    popular: false,
    features: [
      'Up to 50 units',
      'Member management',
      'Violation tracking',
      'Document storage',
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
    accent: '#C8962E',
    popular: true,
    features: [
      'Up to 150 units',
      'Everything in Starter',
      'Advanced financial reports',
      'Bulk payment requests',
      'Priority email support',
      'Voting analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    maxUnits: null,
    accent: '#D4522A',
    popular: false,
    features: [
      'Unlimited units',
      'Everything in Growth',
      'Dedicated account manager',
      'Phone support',
      'Custom branding',
      'API access',
      'SLA guarantee',
    ],
  },
];

const FEATURES = [
  {
    num: '01',
    title: 'Online Payment Collection',
    desc: 'Collect HOA dues, fines, and assessments online via card or bank transfer. Automatic receipts emailed to every member.',
  },
  {
    num: '02',
    title: 'Violation Tracking',
    desc: 'Log, track, and resolve community violations with photos and history. Send automated notices to homeowners.',
  },
  {
    num: '03',
    title: 'Member Management',
    desc: 'Maintain a complete directory of homeowners with unit info, contact details, and voting rights.',
  },
  {
    num: '04',
    title: 'Document Storage',
    desc: 'Store HOA documents, CC&Rs, meeting minutes, and rules in one secure, searchable place.',
  },
  {
    num: '05',
    title: 'Community Voting',
    desc: 'Run board elections and community votes online. Real-time results with full audit trail.',
  },
  {
    num: '06',
    title: 'Announcements',
    desc: 'Broadcast urgent notices, events, and community updates with priority levels and instant delivery.',
  },
];

const TRUST_ITEMS = [
  { value: '50,000+', label: 'Florida HOAs' },
  { value: '14 days', label: 'Free trial' },
  { value: 'No CC', label: 'Required' },
  { value: 'Bank-grade', label: 'Security' },
];

const Landing = () => {
  return (
    <div className="landing">

      {/* ─── Navigation ─── */}
      <nav className="land-nav">
        <Link to="/" className="land-logo">
          <span className="logo-wordmark">Florida HOA</span>
          <span className="logo-shield">Shield</span>
        </Link>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login" className="nav-signin">Sign in</Link>
          <Link to="/register" className="nav-cta">Start Free Trial</Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="land-hero">
        <div className="hero-sunburst" aria-hidden="true"></div>
        <div className="hero-grid-overlay" aria-hidden="true"></div>
        <div className="land-hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dash"></span>
            Built for Florida Communities
            <span className="eyebrow-dash"></span>
          </div>
          <h1 className="hero-headline">
            Community<br />
            governance,<br />
            <em>refined.</em>
          </h1>
          <p className="hero-sub">
            The modern HOA management platform built for Florida communities.
            Collect dues, track violations, hold votes — all in one elegant workspace.
            Setup takes under ten minutes.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">
              Start Free 14-Day Trial
            </Link>
            <a href="#pricing" className="btn-ghost">
              View Pricing
            </a>
          </div>
        </div>

        <div className="hero-trust-bar">
          {TRUST_ITEMS.map((item, i) => (
            <div key={item.label} className="trust-item">
              {i > 0 && <div className="trust-divider" aria-hidden="true"></div>}
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="land-features" id="features">
        <div className="land-section">
          <div className="section-header center">
            <p className="overline">Everything you need</p>
            <h2>One platform.<br />Every HOA task.</h2>
            <p className="section-sub">
              Stop juggling spreadsheets, emails, and paper forms.
              Florida HOA Shield centralizes every workflow your board needs.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <article className="feature-card" key={f.num}>
                <div className="feature-num" aria-hidden="true">{f.num}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="feature-corner-deco" aria-hidden="true"></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="land-how" id="how-it-works">
        <div className="land-section">
          <div className="section-header center">
            <p className="overline">Simple onboarding</p>
            <h2>Up and running<br />in three steps</h2>
          </div>

          <div className="steps-row">
            <div className="step">
              <div className="step-marker">
                <span className="step-n">01</span>
              </div>
              <div className="step-body">
                <h3>Create your HOA</h3>
                <p>Sign up, pick your plan, and set up your community profile. Takes less than five minutes.</p>
              </div>
            </div>
            <div className="step-arrow" aria-hidden="true">→</div>
            <div className="step">
              <div className="step-marker">
                <span className="step-n">02</span>
              </div>
              <div className="step-body">
                <h3>Add your members</h3>
                <p>Import your homeowner list or invite members via email. They get instant access.</p>
              </div>
            </div>
            <div className="step-arrow" aria-hidden="true">→</div>
            <div className="step">
              <div className="step-marker">
                <span className="step-n">03</span>
              </div>
              <div className="step-body">
                <h3>Start managing</h3>
                <p>Send payment requests, post announcements, track violations — everything in one dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="land-pricing" id="pricing">
        <div className="pricing-inner">
          <div className="section-header center light">
            <p className="overline light">Transparent pricing</p>
            <h2>Simple plans,<br />no surprises</h2>
            <p className="section-sub light">
              Start with a 14-day free trial on any plan.
              No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-ribbon">Most Popular</div>
                )}
                <div className="plan-top-bar" style={{ background: plan.accent }}></div>
                <div className="plan-header">
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price-row">
                    <span className="price-sym">$</span>
                    <span className="price-amt">{plan.price}</span>
                    <span className="price-per">/mo</span>
                  </div>
                  <div className="plan-capacity">
                    {plan.maxUnits ? `Up to ${plan.maxUnits} units` : 'Unlimited units'}
                  </div>
                </div>
                <div className="plan-rule"></div>
                <ul className="plan-features-list">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="plan-check" style={{ color: plan.accent }}>✦</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/register?plan=${plan.id}`}
                  className="plan-cta"
                  style={{ '--plan-accent': plan.accent }}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="land-cta">
        <div className="cta-deco-left" aria-hidden="true"></div>
        <div className="cta-deco-right" aria-hidden="true"></div>
        <div className="cta-content">
          <p className="overline light">Get started today</p>
          <h2>Ready to modernize<br />your HOA?</h2>
          <p className="cta-sub">
            Join Florida communities already using HOA Shield.
            No contracts. Cancel anytime.
          </p>
          <Link to="/register" className="btn-cta-dark">
            Get started — it's free for 14 days
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="land-footer">
        <div className="footer-brand">Florida HOA Shield</div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/login">Sign in</Link>
          <Link to="/pricing">Pricing</Link>
          <a href="#features">Features</a>
          <a href="mailto:hello@floridahoashield.com">Contact</a>
        </nav>
        <p className="footer-copy">
          © {new Date().getFullYear()} Florida HOA Shield · Built for Florida communities
        </p>
      </footer>

    </div>
  );
};

export default Landing;
