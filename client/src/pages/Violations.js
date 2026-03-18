import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  open: 'danger',
  notice_sent: 'warning',
  hearing_scheduled: 'warning',
  resolved: 'success',
  fined: 'danger',
};

const Violations = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ member: '', description: '', type: 'other', fineAmount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, mRes] = await Promise.all([api.get('/violations'), isAdmin ? api.get('/members') : Promise.resolve({ data: [] })]);
        setViolations(vRes.data);
        setMembers(mRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/violations', form);
      setViolations([res.data, ...violations]);
      setShowModal(false);
      setForm({ member: '', description: '', type: 'other', fineAmount: 0 });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create violation');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.put(`/violations/${id}`, { status });
      setViolations(violations.map((v) => (v._id === id ? res.data : v)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="loading">Loading violations...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Violation Tracker</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Violation
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Type</th>
              <th>Description</th>
              <th>Fine</th>
              <th>Status</th>
              <th>Date</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No violations found.</td></tr>
            ) : (
              violations.map((v) => (
                <tr key={v._id}>
                  <td>{v.member?.name || '—'}<br /><small>{v.member?.unit}</small></td>
                  <td>{v.type.replace('_', ' ')}</td>
                  <td>{v.description}</td>
                  <td>{v.fineAmount > 0 ? `$${v.fineAmount}` : '—'}</td>
                  <td><span className={`badge badge-${STATUS_COLORS[v.status] || 'default'}`}>{v.status.replace('_', ' ')}</span></td>
                  <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td>
                      <select
                        value={v.status}
                        onChange={(e) => updateStatus(v._id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        <option value="open">Open</option>
                        <option value="notice_sent">Notice Sent</option>
                        <option value="hearing_scheduled">Hearing Scheduled</option>
                        <option value="fined">Fined</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>New Violation</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Member</label>
                <select value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} required>
                  <option value="">Select member...</option>
                  {members.map((m) => <option key={m._id} value={m._id}>{m.name} {m.unit && `(${m.unit})`}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="landscaping">Landscaping</option>
                  <option value="parking">Parking</option>
                  <option value="noise">Noise</option>
                  <option value="property_maintenance">Property Maintenance</option>
                  <option value="rule_violation">Rule Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" required />
              </div>
              <div className="form-group">
                <label>Fine Amount ($)</label>
                <input type="number" value={form.fineAmount} onChange={(e) => setForm({ ...form, fineAmount: e.target.value })} min="0" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Violations;
