import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Voting = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';
  const [votes, setVotes] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', options: '', endDate: '' });

  useEffect(() => {
    api.get('/voting')
      .then((res) => setVotes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchResults = async (id) => {
    try {
      const res = await api.get(`/voting/${id}/results`);
      setResults((prev) => ({ ...prev, [id]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, options: form.options.split('\n').map((o) => o.trim()).filter(Boolean) };
      const res = await api.post('/voting', payload);
      setVotes([res.data, ...votes]);
      setShowModal(false);
      setForm({ title: '', description: '', options: '', endDate: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create vote');
    }
  };

  const handleClose = async (voteId) => {
    if (!window.confirm('Close this vote early? This cannot be undone.')) return;
    try {
      await api.put(`/voting/${voteId}/close`);
      setVotes(votes.filter((v) => v._id !== voteId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close vote');
    }
  };

  const handleCast = async (voteId, choice) => {
    try {
      await api.post(`/voting/${voteId}/cast`, { choice });
      alert('Vote cast successfully!');
      fetchResults(voteId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cast vote');
    }
  };

  if (loading) return <div className="loading">Loading votes...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Community Voting</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Create Vote
          </button>
        )}
      </div>

      {votes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active votes at this time.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {votes.map((v) => {
            const isActive = new Date(v.endDate) > new Date();
            const voteResults = results[v._id];
            return (
              <div key={v._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{v.title}</h3>
                    <small style={{ color: 'var(--text-muted)' }}>
                      Ends {new Date(v.endDate).toLocaleDateString()} &mdash; Created by {v.createdBy?.name}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge badge-${isActive ? 'success' : 'default'}`}>
                      {isActive ? 'Active' : 'Closed'}
                    </span>
                    {isAdmin && isActive && (
                      <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleClose(v._id)}>
                        Close Vote
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>{v.description}</p>

                {isActive && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {v.options.map((opt) => (
                      <button key={opt} className="btn btn-secondary" onClick={() => handleCast(v._id, opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }} onClick={() => fetchResults(v._id)}>
                  View Results
                </button>

                {voteResults && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <strong>Results ({voteResults.totalVotes} votes)</strong>
                    <div style={{ marginTop: '8px' }}>
                      {Object.entries(voteResults.results).map(([opt, count]) => (
                        <div key={opt} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>{opt}</span>
                          <span><strong>{count}</strong> ({voteResults.totalVotes > 0 ? Math.round((count / voteResults.totalVotes) * 100) : 0}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Vote</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" required />
              </div>
              <div className="form-group">
                <label>Options (one per line)</label>
                <textarea value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} rows="4" placeholder="Yes&#10;No&#10;Abstain" required />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
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

export default Voting;
