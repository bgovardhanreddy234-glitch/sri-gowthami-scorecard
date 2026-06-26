import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Plus, Edit, Trash2, Search, Briefcase, Mail, User, ShieldAlert, Key } from 'lucide-react';

const StudentMgmt = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null if creating
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('Active');
  const [year, setYear] = useState('1st');
  const [section, setSection] = useState('A');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Table Controls
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [studResponse, deptResponse] = await Promise.all([
        api.get('/students'),
        api.get('/departments')
      ]);
      setStudents(studResponse.students || []);
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
    setStudentId('');
    setEmail('');
    setPassword('');
    setDepartmentId('');
    setStatus('Active');
    setYear('1st');
    setSection('A');
    setMobileNumber('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingId(student.id);
    setName(student.name);
    setStudentId(student.student_id);
    setEmail(student.email);
    setPassword(''); // Leave blank unless changing
    setDepartmentId(student.department_id || '');
    setStatus(student.status);
    setYear(student.year || '1st');
    setSection(student.section || 'A');
    setMobileNumber(student.mobile_number || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !studentId || !email || !departmentId || (!editingId && !password)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        name,
        student_id: studentId,
        email,
        department_id: departmentId,
        status,
        year,
        section,
        mobile_number: mobileNumber
      };
      if (password && password.trim()) {
        payload.password = password;
      }

      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
        setSuccess('Student details updated successfully!');
      } else {
        await api.post('/students', payload);
        setSuccess('New student created successfully!');
      }
      
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save student record.');
    }
  };

  const handleDelete = async (id, stdId) => {
    if (!window.confirm(`Are you sure you want to permanently delete student ${stdId}? This will delete their user login credentials and evaluation logs.`)) {
      return;
    }

    try {
      await api.delete(`/students/${id}`);
      setSuccess('Student record deleted successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete student.');
    }
  };

  // Filter & Search Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.student_id.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || String(s.department_id) === String(deptFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Student Directory Management</h1>
          <p className="page-subtitle">Add, update, or remove student profiles and coordinate evaluation access.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Student
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
            placeholder="Search by name, Student ID, or email..."
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
            Loading student directory...
          </div>
        ) : filteredStudents.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Profile</th>
                <th>Student ID (Roll No)</th>
                <th>Department</th>
                <th>Class Details</th>
                <th>Portal Username</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((std) => (
                <tr key={std.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{std.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{std.email}</div>
                    {std.mobile_number && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{std.mobile_number}</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{std.student_id}</td>
                  <td>{std.department?.name || 'N/A'}</td>
                  <td>
                    <div>{std.year || '1st'} Year</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Section {std.section || 'A'}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                    {std.user?.username || 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${std.status === 'Active' ? 'excellent' : 'status-archived'}`}>
                      {std.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(std)} title="Edit Student">
                        <Edit size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(std.id, std.student_id)} title="Delete Student">
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
            No student profiles found matching filters.
          </div>
        )}
      </div>

      {/* Form Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Student Details' : 'Add New Student'}</h3>
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
                      placeholder="e.g. Sanjay Kumar"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>STUDENT ID (ROLL NO)</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. SGI-STU-CSE-001"
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
                      placeholder="e.g. student.sanjay@srigowthami.in"
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

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>YEAR</label>
                  <div className="login-input-wrapper">
                    <select
                      className="login-input"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>SECTION</label>
                  <div className="login-input-wrapper">
                    <select
                      className="login-input"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      required
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: 12 }}>MOBILE NUMBER</label>
                  <div className="login-input-wrapper">
                    <input
                      type="text"
                      className="login-input"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMgmt;
