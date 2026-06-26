import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';

const ScorecardTable = ({ user, setCurrentTab, setRecordId, setSelectedFacultyId }) => {
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controls state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState('performance_score');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Deletion Modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = '/performance?';
      if (deptFilter) url += `departmentId=${deptFilter}&`;
      if (yearFilter) url += `academicYear=${yearFilter}&`;
      if (semFilter) url += `semester=${semFilter}&`;
      if (search) url += `search=${search}&`;

      const data = await api.get(url);
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve scorecard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [deptFilter, yearFilter, semFilter, search]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.departments || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, []);

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Sorting application
  const getSortedRecords = () => {
    let list = [...records];

    // Apply client-side Rating Filter
    if (ratingFilter) {
      list = list.filter(r => r.kpi_rating === ratingFilter);
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Nested object references
      if (sortField === 'faculty.name') {
        aVal = a.faculty.name;
        bVal = b.faculty.name;
      } else if (sortField === 'faculty.department.code') {
        aVal = a.faculty.department.code;
        bVal = b.faculty.department.code;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' 
          ? (aVal || 0) - (bVal || 0) 
          : (bVal || 0) - (aVal || 0);
      }
    });
    return list;
  };

  const sortedList = getSortedRecords();

  // Pagination bounds
  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const paginatedList = sortedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (id) => {
    setRecordId(id);
    setCurrentTab('entry');
  };

  const handleDeleteTrigger = (id) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/performance/${deleteId}`);
      setRecords(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetails = (facultyId) => {
    setSelectedFacultyId(facultyId);
    setCurrentTab('detail');
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sri Gowthami Faculty Scorecard</h1>
          <p className="page-subtitle">View, sort, filter, and track performance rankings across semesters.</p>
        </div>
        {(user.role === 'Admin' || user.role === 'HOD') && (
          <button className="btn btn-primary" onClick={() => { setRecordId(null); setCurrentTab('entry'); }}>
            <Plus size={16} />
            Add Evaluation
          </button>
        )}
      </div>

      {error && (
        <div className="alert-bar error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and controls bar */}
      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Faculty or Employee ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filters-wrapper">
          {user.role === 'Admin' && (
            <select
              className="select-filter"
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          <select
            className="select-filter"
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Academic Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>

          <select
            className="select-filter"
            value={semFilter}
            onChange={(e) => { setSemFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>

          <select
            className="select-filter"
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All KPI Ratings</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>

          <button className="btn-icon" onClick={fetchRecords} title="Refresh Table">
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Professional Table layout */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-spinner-wrapper" style={{ minHeight: 200 }}>
            <div className="spinner"></div>
            <p>Loading score records...</p>
          </div>
        ) : paginatedList.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('faculty.name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Faculty Name {getSortIcon('faculty.name')}
                  </div>
                </th>
                <th onClick={() => handleSort('faculty.department.code')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Department {getSortIcon('faculty.department.code')}
                  </div>
                </th>
                <th onClick={() => handleSort('attendance_percentage')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Attendance {getSortIcon('attendance_percentage')}
                  </div>
                </th>
                <th>Lesson Plan</th>
                <th>Test Correct</th>
                <th onClick={() => handleSort('student_feedback_score')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Feedback {getSortIcon('student_feedback_score')}
                  </div>
                </th>
                <th onClick={() => handleSort('course_completion_progress')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Course Progress {getSortIcon('course_completion_progress')}
                  </div>
                </th>
                <th onClick={() => handleSort('performance_score')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Perf Score {getSortIcon('performance_score')}
                  </div>
                </th>
                <th>KPI Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{rec.faculty?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      ID: {rec.faculty?.employee_id}
                    </div>
                  </td>
                  <td>{rec.faculty?.department?.name} ({rec.faculty?.department?.code})</td>
                  <td style={{ fontWeight: '500' }}>{rec.attendance_percentage}%</td>
                  <td style={{ fontSize: 13 }}>{rec.lesson_plan_status}</td>
                  <td style={{ fontSize: 13 }}>{rec.test_correction_turnaround}</td>
                  <td>{rec.student_feedback_score} / 5.0</td>
                  <td style={{ fontWeight: '500' }}>{rec.course_completion_progress || 0}%</td>
                  <td style={{ fontWeight: '800', color: 'var(--primary-light)' }}>
                    {rec.performance_score}%
                  </td>
                  <td>
                    <span className={`badge ${rec.kpi_rating.toLowerCase().replace(/ /g, '-')}`}>
                      {rec.kpi_rating}
                    </span>
                  </td>
                  <td>
                    <span className={`badge status-${rec.status.toLowerCase()}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleViewDetails(rec.faculty_id)}
                        title="View Historical Trends"
                      >
                        <Eye size={14} />
                      </button>

                      {(user.role === 'Admin' || user.role === 'HOD') && (user.role === 'Admin' || rec.faculty?.department_id === user.faculty?.department_id) && (
                        <button 
                          className="btn-icon edit" 
                          onClick={() => handleEdit(rec.id)}
                          title="Edit scorecard"
                        >
                          <Edit size={14} />
                        </button>
                      )}

                      {user.role === 'Admin' && (
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleDeleteTrigger(rec.id)}
                          title="Delete scorecard record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ border: 'none', borderRadius: 0 }}>
            <h3 className="empty-state-title">No Scorecards Found</h3>
            <p className="empty-state-desc">Try clearing search filters or entering a new faculty evaluation record.</p>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({sortedList.length} total scorecards)
          </div>
          <div className="pagination-buttons">
            <button 
              className="page-btn" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1} 
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              className="page-btn" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Deletion Warning Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--needs-improvement)' }}>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>&times;</button>
            </div>
            <div className="modal-body">
              Are you sure you want to permanently delete this faculty scorecard record? This will delete the evaluation scores, rating, and corresponding audit log snapshots. This action is irreversible.
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorecardTable;
