import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Calendar, Filter, Save, CheckCircle, ShieldAlert, User, Search } from 'lucide-react';

const FacultyAttendanceMarking = ({ user }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch departments list
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.departments || []);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch daily attendance records
  const loadDailyRecords = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.get(`/faculty-attendance/daily?date=${date}`);
      setRecords(response.records || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch attendance records for ' + date);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) {
      loadDailyRecords();
    }
  }, [date]);

  // Handle status toggle (Present / Absent)
  const handleStatusChange = (facultyId, newStatus) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === facultyId) {
        return { ...rec, status: newStatus };
      }
      return rec;
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (facultyId, newRemarks) => {
    setRecords(prev => prev.map(rec => {
      if (rec.id === facultyId) {
        return { ...rec, remarks: newRemarks };
      }
      return rec;
    }));
  };

  // Save daily attendance to server
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        date,
        records: records.map(r => ({
          faculty_id: r.id,
          status: r.status,
          remarks: r.remarks
        }))
      };

      await api.post('/faculty-attendance/save', payload);
      setSuccess('Faculty attendance for ' + date + ' saved successfully!');
      // Reload daily records to refresh state
      loadDailyRecords();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save attendance logs.');
    } finally {
      setSaving(false);
    }
  };

  // Filter records by Department and Search Query
  const filteredRecords = records.filter(r => {
    const matchesDept = !deptFilter || String(r.department_code) === String(deptFilter);
    const matchesSearch = !searchQuery || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Faculty Attendance Management</h1>
          <p className="page-subtitle">Mark daily faculty attendance logs, update remarks, and coordinate institution attendance records.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={saving || loading || records.length === 0}
          style={{ height: 42 }}
        >
          <Save size={16} />
          {saving ? 'Saving Records...' : 'Save Attendance'}
        </button>
      </div>

      {success && (
        <div className="alert-bar success" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-bar error" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and selector bar */}
      <div className="table-controls" style={{ padding: 18, borderRadius: 12, backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border)', marginBottom: 24 }}>
        
        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            className="select-filter"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ margin: 0, minWidth: 160 }}
          />
        </div>

        <div className="filters-wrapper" style={{ flex: 1, justifyContent: 'flex-end', gap: 16 }}>
          {/* Search bar */}
          <div className="search-input-wrapper" style={{ maxWidth: 300, margin: 0 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="select-filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Table grid */}
      <div className="table-wrapper" style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px auto' }}></div>
            Loading daily attendance list...
          </div>
        ) : filteredRecords.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Faculty Profile</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Attendance Status</th>
                <th style={{ width: 350 }}>Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((fac) => (
                <tr key={fac.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13, backgroundColor: fac.status === 'Present' ? 'var(--excellent-bg)' : fac.status === 'Absent' ? 'var(--needs-improvement-bg)' : 'var(--border)', color: fac.status === 'Present' ? 'var(--excellent)' : fac.status === 'Absent' ? 'var(--needs-improvement)' : 'var(--text-secondary)' }}>
                        {fac.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{fac.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fac.designation}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fac.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{fac.employee_id}</td>
                  <td>{fac.department}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          cursor: 'pointer', 
                          padding: '6px 12px', 
                          borderRadius: 6, 
                          backgroundColor: fac.status === 'Present' ? 'var(--excellent-bg)' : 'var(--bg-color)', 
                          border: `1px solid ${fac.status === 'Present' ? 'var(--excellent)' : 'var(--border)'}`,
                          color: fac.status === 'Present' ? 'var(--excellent)' : 'var(--text-secondary)',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name={`status-${fac.id}`}
                          checked={fac.status === 'Present'}
                          onChange={() => handleStatusChange(fac.id, 'Present')}
                          style={{ display: 'none' }}
                        />
                        Present
                      </label>

                      <label 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          cursor: 'pointer', 
                          padding: '6px 12px', 
                          borderRadius: 6, 
                          backgroundColor: fac.status === 'Absent' ? 'var(--needs-improvement-bg)' : 'var(--bg-color)', 
                          border: `1px solid ${fac.status === 'Absent' ? 'var(--needs-improvement)' : 'var(--border)'}`,
                          color: fac.status === 'Absent' ? 'var(--needs-improvement)' : 'var(--text-secondary)',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name={`status-${fac.id}`}
                          checked={fac.status === 'Absent'}
                          onChange={() => handleStatusChange(fac.id, 'Absent')}
                          style={{ display: 'none' }}
                        />
                        Absent
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: 13, height: 36 }}
                      placeholder="e.g. Medical leave, On duty..."
                      value={fac.remarks || ''}
                      onChange={(e) => handleRemarksChange(fac.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No faculty members found matching filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyAttendanceMarking;
