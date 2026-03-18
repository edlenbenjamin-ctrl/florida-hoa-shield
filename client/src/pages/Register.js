import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const PLAN_LABELS = { starter: 'Starter — $49/mo', growth: 'Growth — $99/mo', pro: 'Pro — $199/mo' };
const PLAN_COLORS = { starter: '#1e3a5f', growth: '#f0a500', pro: '#27ae60' };

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    unit: '',
    phone: '',
    plan: searchParams.get('plan') || 'starter',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && ['starter', 'growth', 'pro'].includes(planParam)) {
      setForm((f) => ({ ...f, plan: planParam }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const planColor = PLAN_COLORS[form.plan] || PLAN_COLORS.starter;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Florida HOA Shield</h1>
          <p>Create your account — 14-day free trial</p>
        </div>

        {/* Plan selector */}
        <div className="plan-selector">
          <label>Selected Plan</label>
          <div className="plan-selector-tabs">
            {['starter', 'growth', 'pro'].map((p) => (
              <button
                key={p}
                type="button"
                className={`plan-tab ${form.plan === p ? 'active' : ''}`}
                style={form.plan === p ? { borderColor: PLAN_COLORS[p], color: PLAN_COLORS[p] } : {}}
                onClick={() => setForm({ ...form, plan: p })}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="plan-selected-label" style={{ color: planColor }}>
            {PLAN_LABELS[form.plan]}
            {form.plan === 'growth' && (
              <span className="plan-popular-tag">Most Popular</span>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="John Smith" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required />
          </div>
          <div className="form-group">
            <label>Unit Number</label>
            <input type="text" value={form.unit} onChange={set('unit')} placeholder="e.g. 101A" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 555-5555" />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ background: planColor }}
          >
            {loading ? 'Creating account...' : 'Start Free 14-Day Trial'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
          {' · '}
          <Link to="/pricing">View plans</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
