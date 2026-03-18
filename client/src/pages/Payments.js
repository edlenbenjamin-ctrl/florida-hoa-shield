import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Payments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [payingId, setPayingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ memberId: '', amount: '', category: 'dues', description: '', dueDate: '' });

  const params = new URLSearchParams(location.search);
  const paymentSuccess = params.get('success') === 'true';
  const paymentCanceled = params.get('canceled') === 'true';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingRes, historyRes] = await Promise.all([
          api.get('/payments/pending'),
          api.get('/payments/history'),
        ]);
        setPending(pendingRes.data);
        setHistory(historyRes.data);
        if (isAdmin) {
          const membersRes = await api.get('/members');
          setMembers(membersRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const handlePay = async (recordId) => {
    setPayingId(recordId);
    try {
      const res = await api.post('/payments/create-checkout-session', { recordId });
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start payment. Ensure STRIPE_SECRET_KEY is configured.');
      setPayingId(null);
    }
  };

  const handleResendEmail = async (recordId) => {
    setResendingId(recordId);
    try {
      const res = await api.post(`/payments/resend-email/${recordId}`);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend email. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are configured.');
    } finally {
      setResendingId(null);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments/create-payment-request', requestForm);
      setPending([res.data, ...pending]);
      setShowRequestModal(false);
      setRequestForm({ memberId: '', amount: '', category: 'dues', description: '', dueDate: '' });
      alert(`Payment request created and email sent to member.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create payment request');
    }
  };

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowRequestModal(true)}>
            + Create Payment Request
          </button>
        )}
      </div>

      {paymentSuccess && (
        <div className="card" style={{ background: '#d4edda', borderLeft: '4px solid #27ae60', color: '#155724', marginBottom: '16px' }}>
          <strong>Payment successful!</strong> A receipt has been emailed to you. It may take a moment for this page to update.
        </div>
      )}
      {paymentCanceled && (
        <div className="card" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', color: '#856404', marginBottom: '16px' }}>
          <strong>Payment canceled.</strong> No charge was made.
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #c0392b' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c0392b' }}>
            ${pending.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Outstanding Balance</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #27ae60' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#27ae60' }}>
            ${history.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Total Collected</div>
        </div>
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>{pending.length}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Pending Payments</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pending')}>
          Pending ({pending.length})
        </button>
        <button className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('history')}>
          Payment History ({history.length})
        </button>
      </div>

      {tab === 'pending' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                {isAdmin && <th>Member</th>}
                <th>Amount</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No pending payments.
                  </td>
                </tr>
              ) : (
                pending.map((r) => (
                  <tr key={r._id}>
                    <td>{r.description}</td>
                    <td><span className="badge badge-warning">{r.category.replace('_', ' ')}</span></td>
                    {isAdmin && (
                      <td>
                        <div>{r.member?.name || '—'}</div>
                        {r.member?.unit && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unit {r.member.unit}</div>}
                        {r.member?.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.member.email}</div>}
                      </td>
                    )}
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>${r.amount.toLocaleString()}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                          disabled={payingId === r._id}
                          onClick={() => handlePay(r._id)}
                        >
                          {payingId === r._id ? 'Redirecting...' : 'Pay Now'}
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                            disabled={resendingId === r._id}
                            onClick={() => handleResendEmail(r._id)}
                            title="Resend payment email to member"
                          >
                            {resendingId === r._id ? 'Sending...' : 'Resend Email'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                {isAdmin && <th>Member</th>}
                <th>Amount</th>
                <th>Paid Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No payment history yet.
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r._id}>
                    <td>{r.description}</td>
                    <td><span className="badge badge-info">{r.category.replace('_', ' ')}</span></td>
                    {isAdmin && (
                      <td>
                        <div>{r.member?.name || '—'}</div>
                        {r.member?.unit && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unit {r.member.unit}</div>}
                      </td>
                    )}
                    <td style={{ fontWeight: 600, color: '#27ae60' }}>${r.amount.toLocaleString()}</td>
                    <td>{r.paidDate ? new Date(r.paidDate).toLocaleDateString() : '—'}</td>
                    <td><span className="badge badge-success">Paid</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin: Create Payment Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Payment Request</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 0 }}>
              A payment email with a secure Stripe link will be sent to the member automatically.
            </p>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Member</label>
                <select value={requestForm.memberId} onChange={(e) => setRequestForm({ ...requestForm, memberId: e.target.value })} required>
                  <option value="">Select a member...</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>{m.name} {m.unit ? `(Unit ${m.unit})` : ''} — {m.email}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={requestForm.category} onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}>
                  {['dues', 'fine', 'maintenance', 'utilities', 'insurance', 'legal', 'administrative', 'other'].map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" value={requestForm.amount} onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })} min="1" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} placeholder="e.g. Monthly HOA Dues — March 2026" required />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={requestForm.dueDate} onChange={(e) => setRequestForm({ ...requestForm, dueDate: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create &amp; Send Email</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
