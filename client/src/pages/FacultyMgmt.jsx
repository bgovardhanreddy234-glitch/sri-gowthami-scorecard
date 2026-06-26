import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Plus, Edit, Trash2, Search, Briefcase, Mail, User, ShieldAlert, Key } from 'lucide-react';

const FacultyMgmt = () => {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null if creating
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('Active');
  
  // Deletion modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmEmpId, setDeleteConfirmEmpId] = useState('');
  
  // Table Controls
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [facResponse, deptResponse] = await Promise.all([
        api.get('/faculty/all'),
        api.get('/departments')
      ]);
      setFaculties(facResponse.faculties || []);
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
    setEmployeeId('');
    setEmail('');
    setPassword('');
    setDepartmentId('');
    setStatus('Active');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (faculty) => {
    setEditingId(faculty.id);
    setName(faculty.name);
    setEmployeeId(faculty.employee_id);
    setEmail(faculty.email);
    setPassword(''); // Leave blank unless changing
    setDepartmentId(faculty.department_id || '');
    setStatus(faculty.status);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !employeeId || !email || !departmentId || (!editingId && !password)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        name,
        employee_id: employeeId,
        email,
        department_id: departmentId,
        status
      };
      if (password && password.trim()) {
        payload.password = password;
      }

      if (editingId) {
        await api.put(`/faculty/${editingId}`, payload);
        setSuccess('Faculty member details updated successfully!');
      } else {
        await api.post('/faculty', payload);
        setSuccess('New faculty member created successfully!');
      }
      
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save faculty record.');
    }
  };

  const handleDeleteTrigger = (id, empId) => {
    setDeleteConfirmId(id);
    setDeleteConfirmEmpId(empId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/faculty/${deleteConfirmId}`);
      setSuccess('Faculty member record deleted successfully!');
      setDeleteConfirmId(null);
      setDeleteConfirmEmpId('');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete faculty member.');
      setDeleteConfirmId(null);
      setDeleteConfirmEmpId('');
    }
  };

  // Filter & Search Logic
  const filteredFaculties = faculties.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          f.employee_id.toLowerCase().includes(search.toLowerCase()) || 
                          f.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || String(f.department_id) === String(deptFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Faculty Directory Management</h1>
          <p className="page-subtitle">Add, update, or remove faculty profiles and coordinate system logins.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Faculty
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
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-wrapper">
          <select
            className="select-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="table-wrapper" style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Loading faculty listings...
          </div>
        ) : filteredFaculties.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Faculty Profile</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Username</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties.map((fac) => (
                <tr key={fac.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fac.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fac.email}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{fac.employee_id}</td>
                  <td>{fac.department?.name || 'N/A'}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                    {fac.user?.username || 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${fac.status === 'Active' ? 'excellent' : 'status-archived'}`}>
                      {fac.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(fac)} title="Edit Faculty">
                        <Edit size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDeleteTrigger(fac.id, fac.employee_id)} id={`delete-btn-${fac.id}`} title="Delete Faculty">
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
            No faculty profiles found matching filters.
          </div>
        )}
      </div>

      {/* Form Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Faculty Details' : 'Add New Faculty Member'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: 12 }}>FULL NAME</label>
                  <div className="login-input-wrapper">
                    <User className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>EMPLOYEE ID</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. SGI-CSE-001"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>DEPARTMENT</label>
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

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: 12 }}>EMAIL ADDRESS</label>
                  <div className="login-input-wrapper">
                    <Mail className="login-input-icon" />
                    <input
                      type="email"
                      className="login-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. faculty.john@srigowthami.in"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    PASSWORD {editingId && <span style={{ opacity: 0.5 }}>(optional)</span>}
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

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>STATUS</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <select
                      className="login-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                      style={{ appearance: 'none' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Deletion Confirm Modal Dialog */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={() => { setDeleteConfirmId(null); setDeleteConfirmEmpId(''); }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px 0' }}>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>
                Are you sure you want to permanently delete faculty member <strong>{deleteConfirmEmpId}</strong>?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                <ShieldAlert size={16} style={{ color: 'var(--needs-improvement)' }} />
                This will delete their user account, profile, and all historical scorecard log records.
              </p>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setDeleteConfirmId(null); setDeleteConfirmEmpId(''); }}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmDelete}
                style={{ backgroundColor: 'var(--needs-improvement)', borderColor: 'var(--needs-improvement)', color: '#fff' }}
              >
                Delete Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMgmt;
