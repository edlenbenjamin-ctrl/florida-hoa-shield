import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['bylaws', 'meeting_minutes', 'financial_report', 'policy', 'form', 'legal', 'other'];
const EMPTY_FORM = { title: '', category: 'other', description: '', fileUrl: '', fileName: '', isPublic: true };

const Documents = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'board_member';
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const params = filter ? `?category=${filter}` : '';
    api.get(`/documents${params}`)
      .then((res) => setDocuments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const openCreate = () => {
    setEditDoc(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditDoc(d);
    setForm({ title: d.title, category: d.category, description: d.description || '', fileUrl: d.fileUrl, fileName: d.fileName, isPublic: d.isPublic });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDoc) {
        const res = await api.put(`/documents/${editDoc._id}`, form);
        setDocuments(documents.map((d) => (d._id === editDoc._id ? res.data : d)));
      } else {
        const res = await api.post('/documents', form);
        setDocuments([res.data, ...documents]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter((d) => d._id !== id));
    } catch {
      alert('Failed to delete document');
    }
  };

  if (loading) return <div className="loading">Loading documents...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Document Library</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Document
          </button>
        )}
      </div>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Description</th>
              <th>Uploaded By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No documents found.</td></tr>
            ) : (
              documents.map((d) => (
                <tr key={d._id}>
                  <td><strong>{d.title}</strong></td>
                  <td><span className="badge badge-info">{d.category.replace('_', ' ')}</span></td>
                  <td>{d.description || '—'}</td>
                  <td>{d.uploadedBy?.name || '—'}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>
                      View
                    </a>
                    {isAdmin && (
                      <>
                        <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => openEdit(d)}>
                          Edit
                        </button>
                        <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => handleDelete(d._id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editDoc ? 'Edit Document' : 'Add Document'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="2" />
              </div>
              <div className="form-group">
                <label>File URL</label>
                <input type="url" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>File Name</label>
                <input type="text" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select value={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.value === 'true' })}>
                  <option value="true">Public (all members)</option>
                  <option value="false">Private (admin only)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editDoc ? 'Save Changes' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
