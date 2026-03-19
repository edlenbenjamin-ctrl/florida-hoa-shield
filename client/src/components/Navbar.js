import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Navbar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/announcements', label: 'Announcements' },
  { path: '/members', label: 'Members' },
  { path: '/violations', label: 'Violations' },
  { path: '/documents', label: 'Documents' },
  { path: '/financials', label: 'Financials' },
  { path: '/voting', label: 'Voting' },
  { path: '/payments', label: 'Payments' },
];

const PLAN_COLORS = { starter: '#1e3a5f', growth: '#f0a500', pro: '#27ae60' };

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/subscription/current').then((res) => setPlan(res.data)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">Florida HOA <span>Shield</span></Link>
      </div>

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        &#9776;
      </button>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-user">
        <Link to="/profile" className="user-name" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }} title="My Profile">
          {user?.name}
        </Link>
        <span className={`role-badge role-${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
        {plan && (
          <span
            className="plan-badge"
            style={{ background: PLAN_COLORS[plan.plan] || '#1e3a5f' }}
            title={`${plan.planDetails?.name || plan.plan} Plan`}
          >
            {(plan.planDetails?.name || plan.plan).toUpperCase()}
          </span>
        )}
        {plan && plan.plan !== 'pro' && (
          <Link to="/pricing" className="upgrade-btn">
            Upgrade
          </Link>
        )}
        <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
