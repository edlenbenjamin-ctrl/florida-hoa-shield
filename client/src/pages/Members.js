import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Members = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api.get('/members')
      .then((res) => setMembers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (m) => {
    setEditMember(m);
    setEditForm({ name: m.name, email: m.email, unit: m.unit || '', phone: m.phone || '', role: m.role, votingRights: m.votingRights });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/members/${editMember._id}`, editForm);
      setMembers(members.map((m) => (m._id === editMember._id ? res.data : m)));
      setEditMember(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this member?')) return;
    try {
      await api.delete(`/members/${id}`);
      setMembers(members.filter((m) => m._id !== id));
    } catch {
      alert('Failed to deactivate member');
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.unit || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading members...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Member Directory</h1>
        <span className="badge badge-info">{members.length} members</span>
      </div>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Search by name, email, or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Unit</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Voting Rights</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No members found.</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m._id}>
                  <td><strong>{m.name}</strong>{m._id === user?.id && ' (You)'}</td>
                  <td>{m.email}</td>
                  <td>{m.unit || '—'}</td>
                  <td>{m.phone || '—'}</td>
                  <td>
                    <span className={`badge badge-${m.role === 'admin' ? 'warning' : m.role === 'board_member' ? 'success' : 'default'}`}>
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${m.votingRights ? 'success' : 'danger'}`}>
                      {m.votingRights ? 'Yes' : 'No'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => openEdit(m)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleDelete(m._id)}>
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editMember && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Member</h2>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Unit Number</label>
                <input type="text" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="homeowner">Homeowner</option>
                  <option value="board_member">Board Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Voting Rights</label>
                <select value={editForm.votingRights} onChange={(e) => setEditForm({ ...editForm, votingRights: e.target.value === 'true' })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditMember(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
