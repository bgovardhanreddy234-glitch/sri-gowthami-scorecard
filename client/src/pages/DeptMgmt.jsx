import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Plus, Edit, Trash2, Search, Briefcase, ShieldAlert } from 'lucide-react';

const DeptMgmt = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null if creating
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  
  // Table Controls
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const deptResponse = await api.get('/departments');
      setDepartments(deptResponse.departments || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch department list.');
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
    setCode('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingId(dept.id);
    setName(dept.name);
    setCode(dept.code);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !code) {
      setError('Both Department Name and Code are required.');
      return;
    }

    try {
      const payload = { name, code };

      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
        setSuccess('Department details updated successfully!');
      } else {
        await api.post('/departments', payload);
        setSuccess('New department created successfully!');
      }
      
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save department details.');
    }
  };

  const handleDelete = async (id, deptCode) => {
    if (!window.confirm(`Are you sure you want to permanently delete department ${deptCode}? This will delete all linked faculty scorecards, students, and active HOD accounts!`)) {
      return;
    }

    try {
      await api.delete(`/departments/${id}`);
      setSuccess('Department deleted successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete department.');
    }
  };

  // Search Logic
  const filteredDepts = departments.filter(d => {
    return d.name.toLowerCase().includes(search.toLowerCase()) || 
           d.code.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 850, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Institution Department Management</h1>
          <p className="page-subtitle">Add, update, or remove academic department branches and catalogs.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Department
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
            placeholder="Search departments by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="table-wrapper" style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Loading academic departments...
          </div>
        ) : filteredDepts.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Department Code</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepts.map((dept) => (
                <tr key={dept.id}>
                  <td style={{ fontWeight: 600 }}>{dept.name}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: 'var(--primary-light)' }}>
                    {dept.code}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(dept)} title="Edit Department">
                        <Edit size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(dept.id, dept.code)} title="Delete Department">
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
            No departments found.
          </div>
        )}
      </div>

      {/* Form Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Department details' : 'Add Department Branch'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>DEPARTMENT NAME</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Civil Engineering"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>DEPARTMENT CODE</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CE"
                      required
                    />
                  </div>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptMgmt;
