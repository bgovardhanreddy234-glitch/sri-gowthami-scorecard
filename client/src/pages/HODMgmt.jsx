import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Plus, Edit, Trash2, Search, Briefcase, Mail, User, ShieldAlert, Key } from 'lucide-react';

const HODMgmt = () => {
  const [hods, setHods] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null if creating
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  
  // Table Controls
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [hodResponse, deptResponse] = await Promise.all([
        api.get('/hods'),
        api.get('/departments')
      ]);
      setHods(hodResponse.HODs || []);
      setDepartments(deptResponse.departments || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setDepartmentId('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (hod) => {
    setEditingId(hod.id);
    setName(hod.name);
    setUsername(hod.username);
    setEmail(hod.email);
    setPassword(''); // Leave blank unless changing
    setDepartmentId(hod.department_id || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !username || !email || !departmentId || (!editingId && !password)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        name,
        username,
        email,
        department_id: departmentId
      };
      if (password && password.trim()) {
        payload.password = password;
      }

      if (editingId) {
        await api.put(`/hods/${editingId}`, payload);
        setSuccess('HOD account details updated successfully!');
      } else {
        await api.post('/hods', payload);
        setSuccess('New HOD account created successfully!');
      }
      
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save HOD record.');
    }
  };

  const handleDelete = async (id, usrName) => {
    if (!window.confirm(`Are you sure you want to permanently delete HOD account ${usrName}? This HOD will no longer be able to log in to verify departmental scorecards.`)) {
      return;
    }

    try {
      await api.delete(`/hods/${id}`);
      setSuccess('HOD account deleted successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete HOD.');
    }
  };

  // Search Logic
  const filteredHods = hods.filter(h => {
    return h.name.toLowerCase().includes(search.toLowerCase()) || 
           h.username.toLowerCase().includes(search.toLowerCase()) || 
           h.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Head of Department (HOD) Accounts</h1>
          <p className="page-subtitle">Manage administrative HOD accounts coordinates to oversee departmental evaluation.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add HOD Account
        </button>
      </div>

      {success && (
        <div className="alert-bar success" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-bar error" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="table-controls" style={{ padding: 18, borderRadius: 12, backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border)', marginBottom: 20 }}>
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search HOD by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="table-wrapper" style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Loading HOD accounts...
          </div>
        ) : filteredHods.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>HOD Officer</th>
                <th>Portal Username</th>
                <th>Assigned Department</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHods.map((hod) => (
                <tr key={hod.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{hod.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{hod.email}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500, color: 'var(--primary-light)' }}>
                    {hod.username}
                  </td>
                  <td>{hod.department?.name || 'All Departments'}</td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(hod)} title="Edit HOD">
                        <Edit size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(hod.id, hod.username)} title="Delete HOD">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No HOD accounts found.
          </div>
        )}
      </div>

      {/* Form Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit HOD Account' : 'Create HOD Account'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>FULL NAME</label>
                  <div className="login-input-wrapper">
                    <User className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Srinivasa Rao"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>PORTAL USERNAME</label>
                  <div className="login-input-wrapper">
                    <User className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. hod_cse"
                      required
                      disabled={editingId !== null}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>EMAIL ADDRESS</label>
                  <div className="login-input-wrapper">
                    <Mail className="login-input-icon" />
                    <input
                      type="email"
                      className="login-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. hod.cse@srigowthami.in"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>ASSIGNED DEPARTMENT</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <select
                      className="login-input"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      required
                      style={{ appearance: 'none', paddingRight: 30 }}
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    ACCOUNT PASSWORD {editingId && <span style={{ opacity: 0.5 }}>(optional)</span>}
                  </label>
                  <div className="login-input-wrapper">
                    <Key className="login-input-icon" />
                    <input
                      type="password"
                      className="login-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingId ? 'Leave blank to retain' : 'Enter secure password'}
                      required={!editingId}
                    />
                  </div>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create HOD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODMgmt;
