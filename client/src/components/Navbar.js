import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">Florida HOA Shield</Link>
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
        <span className="user-name">{user?.name}</span>
        <span className={`role-badge role-${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
        <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
