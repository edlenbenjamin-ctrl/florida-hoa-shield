import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const PLAN_COLORS = { starter: '#1e3a5f', growth: '#f0a500', pro: '#27ae60' };

const StatCard = ({ title, value, to, color }) => (
  <Link to={to} className="stat-card" style={{ borderTopColor: color }}>
    <span className="stat-value">{value}</span>
    <span className="stat-title">{title}</span>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, violations: 0, announcements: 0, activeVotes: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, violationsRes, announcementsRes, votingRes, subRes] = await Promise.all([
          api.get('/members'),
          api.get('/violations'),
          api.get('/announcements'),
          api.get('/voting'),
          api.get('/subscription/current').catch(() => ({ data: null })),
        ]);
        if (subRes.data) setSubscription(subRes.data);
        setStats({
          members: membersRes.data.length,
          violations: violationsRes.data.filter((v) => v.status !== 'resolved').length,
          announcements: announcementsRes.data.length,
          activeVotes: votingRes.data.filter((v) => new Date(v.endDate) > new Date()).length,
        });
        setAnnouncements(announcementsRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p>Here's what's happening in your community.</p>
      </div>

      {/* Plan banner */}
      {subscription && (
        <div
          className="plan-banner"
          style={{ borderLeftColor: PLAN_COLORS[subscription.plan] || '#1e3a5f' }}
        >
          <div className="plan-banner-info">
            <span className="plan-banner-badge" style={{ background: PLAN_COLORS[subscription.plan] }}>
              {subscription.planDetails?.name || subscription.plan} Plan
            </span>
            {subscription.subscriptionStatus === 'trialing' && subscription.daysLeftInTrial !== null && (
              <span className="plan-banner-trial">
                {subscription.daysLeftInTrial} day{subscription.daysLeftInTrial !== 1 ? 's' : ''} left in trial
              </span>
            )}
            {subscription.subscriptionStatus === 'active' && (
              <span className="plan-banner-active">Active</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {subscription.subscriptionStatus === 'active' && (
              <button
                className="plan-banner-upgrade"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={async () => {
                  try {
                    const api = (await import('../services/api')).default;
                    const res = await api.post('/subscription/billing-portal');
                    window.location.href = res.data.url;
                  } catch {
                    alert('Billing portal unavailable. Is Stripe configured?');
                  }
                }}
              >
                Manage Billing
              </button>
            )}
            {subscription.plan !== 'pro' && (
              <Link to="/pricing" className="plan-banner-upgrade">
                Upgrade Plan →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard title="Total Members" value={stats.members} to="/members" color="#1e3a5f" />
        <StatCard title="Open Violations" value={stats.violations} to="/violations" color="#c0392b" />
        <StatCard title="Announcements" value={stats.announcements} to="/announcements" color="#f0a500" />
        <StatCard title="Active Votes" value={stats.activeVotes} to="/voting" color="#27ae60" />
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Announcements</h2>
          <Link to="/announcements" className="see-all">See all</Link>
        </div>
        {announcements.length === 0 ? (
          <p className="empty-state">No announcements yet.</p>
        ) : (
          <div className="announcement-list">
            {announcements.map((a) => (
              <div key={a._id} className="announcement-item">
                <div className="announcement-header">
                  <strong>{a.title}</strong>
                  <span className={`badge badge-${a.priority === 'urgent' ? 'danger' : a.priority === 'high' ? 'warning' : 'info'}`}>
                    {a.priority}
                  </span>
                </div>
                <p>{a.content}</p>
                <small>Posted by {a.author?.name} &mdash; {new Date(a.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
