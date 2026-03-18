import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = { low: 'default', medium: 'info', high: 'warning', urgent: 'danger' };

const Announcements = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium', expiresAt: '' });

  useEffect(() => {
    api.get('/announcements')
      .then((res) => setAnnouncements(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements', form);
      setAnnouncements([res.data, ...announcements]);
      setShowModal(false);
      setForm({ title: '', content: '', priority: 'medium', expiresAt: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter((a) => a._id !== id));
    } catch {
      alert('Failed to remove announcement');
    }
  };

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Announcement
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No announcements at this time.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((a) => (
            <div key={a._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{a.title}</h3>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Posted by {a.author?.name} &mdash; {new Date(a.createdAt).toLocaleDateString()}
                    {a.expiresAt && ` · Expires ${new Date(a.expiresAt).toLocaleDateString()}`}
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${PRIORITY_COLORS[a.priority]}`}>{a.priority}</span>
                  {isAdmin && (
                    <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleRemove(a._id)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: 'var(--text)', lineHeight: 1.7 }}>{a.content}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>New Announcement</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows="4" required />
              </div>
              <div className="form-group">
                <label>Expires (optional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
