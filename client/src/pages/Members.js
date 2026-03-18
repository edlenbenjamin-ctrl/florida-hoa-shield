import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Members = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/members')
      .then((res) => setMembers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No members found.</td></tr>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;
