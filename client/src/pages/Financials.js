import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['dues', 'fine', 'maintenance', 'utilities', 'insurance', 'legal', 'administrative', 'other'];
const EMPTY_FORM = { type: 'income', category: 'dues', amount: '', description: '', date: '', isPaid: false };

const Financials = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [api.get('/financials')];
        if (isAdmin) requests.push(api.get('/financials/summary'));
        const [recordsRes, summaryRes] = await Promise.all(requests);
        setRecords(recordsRes.data);
        if (summaryRes) setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const openCreate = () => {
    setEditRecord(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRecord(r);
    setForm({
      type: r.type,
      category: r.category,
      amount: r.amount,
      description: r.description,
      date: r.date ? r.date.split('T')[0] : '',
      isPaid: r.isPaid,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editRecord) {
        const res = await api.put(`/financials/${editRecord._id}`, form);
        setRecords(records.map((r) => (r._id === editRecord._id ? res.data : r)));
      } else {
        const res = await api.post('/financials', form);
        setRecords([res.data, ...records]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this financial record?')) return;
    try {
      await api.delete(`/financials/${id}`);
      setRecords(records.filter((r) => r._id !== id));
    } catch {
      alert('Failed to delete record');
    }
  };

  if (loading) return <div className="loading">Loading financials...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Financial Management</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Record
          </button>
        )}
      </div>

      {isAdmin && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Income', value: summary.totalIncome, color: '#27ae60' },
            { label: 'Total Expenses', value: summary.totalExpenses, color: '#c0392b' },
            { label: 'Balance', value: summary.balance, color: summary.balance >= 0 ? '#27ae60' : '#c0392b' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${s.color}` }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>${s.value.toLocaleString()}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No financial records found.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${r.type === 'income' ? 'success' : 'danger'}`}>{r.type}</span></td>
                  <td>{r.category.replace('_', ' ')}</td>
                  <td>{r.description}</td>
                  <td style={{ fontWeight: 600, color: r.type === 'income' ? '#27ae60' : '#c0392b' }}>
                    {r.type === 'income' ? '+' : '-'}${r.amount.toLocaleString()}
                  </td>
                  <td><span className={`badge badge-${r.isPaid ? 'success' : 'warning'}`}>{r.isPaid ? 'Paid' : 'Pending'}</span></td>
                  {isAdmin && (
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleDelete(r._id)}>
                        Delete
                      </button>
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
            <h2>{editRecord ? 'Edit Financial Record' : 'Add Financial Record'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.value === 'true' })}>
                  <option value="false">Pending</option>
                  <option value="true">Paid</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editRecord ? 'Save Changes' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;
