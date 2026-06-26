import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Plus, Edit, Trash2, Search, BookOpen, Briefcase, ShieldAlert } from 'lucide-react';

const CourseMgmt = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null if creating
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  
  // Table Controls
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseResponse, deptResponse, facResponse] = await Promise.all([
        api.get('/courses'),
        api.get('/departments'),
        api.get('/faculty/all')
      ]);
      setCourses(courseResponse.courses || []);
      setDepartments(deptResponse.departments || []);
      setFaculties(facResponse.faculties || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch catalog data from the server.');
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
    setDepartmentId('');
    setFacultyId('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingId(course.id);
    setName(course.name);
    setCode(course.code);
    setDepartmentId(course.department_id || '');
    setFacultyId(course.faculty_id || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !code || !departmentId) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        name,
        code,
        department_id: departmentId,
        faculty_id: facultyId || null
      };

      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
        setSuccess('Course details updated successfully!');
      } else {
        await api.post('/courses', payload);
        setSuccess('New course created successfully!');
      }
      
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save course record.');
    }
  };

  const handleDelete = async (id, courseCode) => {
    if (!window.confirm(`Are you sure you want to permanently delete course ${courseCode}? This will remove it from the academic directory and dissociate it from assigned faculties.`)) {
      return;
    }

    try {
      await api.delete(`/courses/${id}`);
      setSuccess('Course record deleted successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete course.');
    }
  };

  // Filter & Search Logic
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.code.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || String(c.department_id) === String(deptFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Course Catalog Management</h1>
          <p className="page-subtitle">Add, update, or remove academic courses and assign teaching faculty members.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Course
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
            placeholder="Search by course name or code..."
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
            Loading courses catalog...
          </div>
        ) : filteredCourses.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Course Details</th>
                <th>Course Code</th>
                <th>Academic Department</th>
                <th>Assigned Instructor</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{course.name}</div>
                  </td>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{course.code}</td>
                  <td>{course.department?.name || 'N/A'}</td>
                  <td style={{ fontWeight: 500, color: course.faculty ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                    {course.faculty ? course.faculty.name : 'Unassigned'}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(course)} title="Edit Course">
                        <Edit size={14} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(course.id, course.code)} title="Delete Course">
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
            No courses found matching filters.
          </div>
        )}
      </div>

      {/* Form Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Course Details' : 'Add New Course'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>COURSE NAME</label>
                  <div className="login-input-wrapper">
                    <BookOpen className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Data Structures & Algorithms"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>COURSE CODE</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <input
                      type="text"
                      className="login-input"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. CS101"
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

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>ASSIGNED INSTRUCTOR (OPTIONAL)</label>
                  <div className="login-input-wrapper">
                    <Briefcase className="login-input-icon" />
                    <select
                      className="login-input"
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      style={{ appearance: 'none', paddingRight: 30 }}
                    >
                      <option value="">Select Instructor...</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMgmt;
