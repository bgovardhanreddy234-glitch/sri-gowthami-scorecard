import React, { useEffect, useState } from 'react';
import { api, getSavedUser } from '../utils/api';
import { Search, BookOpen, GraduationCap, Mail, Phone, Calendar, User, ShieldAlert, Award } from 'lucide-react';

const DeptFacultyClasses = ({ user }) => {
  const savedUser = user || getSavedUser();
  const isStudent = savedUser && savedUser.role === 'Student';
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/academic-directory');
      setDepartments(response.departments || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch the academic directory catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic: match department name, faculty name, course name, or course code
  const filteredDepartments = departments.map(dept => {
    const matchedFaculties = (dept.faculties || []).filter(fac => {
      const nameMatch = fac.name.toLowerCase().includes(search.toLowerCase());
      const designationMatch = (fac.designation || '').toLowerCase().includes(search.toLowerCase());
      const courseMatch = (fac.courses || []).some(course => 
        course.name.toLowerCase().includes(search.toLowerCase()) ||
        course.code.toLowerCase().includes(search.toLowerCase())
      );
      return nameMatch || designationMatch || courseMatch;
    });

    const deptNameMatch = dept.name.toLowerCase().includes(search.toLowerCase()) || 
                          dept.code.toLowerCase().includes(search.toLowerCase());

    // If search term matches the department itself, show all its faculties, otherwise show filtered faculties
    const finalFaculties = deptNameMatch ? (dept.faculties || []) : matchedFaculties;

    return {
      ...dept,
      faculties: finalFaculties,
      // Keep track if the department matches the search
      hasMatch: deptNameMatch || finalFaculties.length > 0
    };
  }).filter(dept => dept.hasMatch);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Institution Academic Directory</h1>
          <p className="page-subtitle">Browse academic departments, faculty profiles, and their assigned teaching classes/courses.</p>
        </div>
      </div>

      {error && (
        <div className="alert-bar error" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="table-controls" style={{ padding: 18, borderRadius: 12, backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border)', marginBottom: 24 }}>
        <div className="search-input-wrapper" style={{ maxWidth: '100%', width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Department, Faculty Name, Course/Class Name or Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="academic-directory-search"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px auto' }}></div>
          Loading Academic Directory...
        </div>
      ) : filteredDepartments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {filteredDepartments.map((dept) => (
            <div 
              key={dept.id} 
              className="dept-section-card" 
              style={{
                borderRadius: 16,
                backgroundColor: 'var(--panel-bg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Department Header */}
              <div 
                style={{
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                    {dept.name}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: '13px' }}>
                    Sri Gowthami Educational Institutions
                  </p>
                </div>
                <span 
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}
                >
                  {dept.code}
                </span>
              </div>

              {/* Department Contents */}
              <div style={{ padding: '24px' }}>
                {dept.faculties && dept.faculties.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                    {dept.faculties.map((fac) => (
                      <div 
                        key={fac.id} 
                        className="faculty-profile-card"
                        style={{
                          borderRadius: 12,
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--body-bg)',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 16,
                          boxShadow: 'var(--shadow-xs)',
                          transition: 'border-color 0.2s ease'
                        }}
                      >
                        {/* Faculty Information */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {fac.name}
                              </h3>
                              <span style={{ fontSize: '13px', color: 'var(--primary-light)', fontWeight: '600' }}>
                                {fac.designation || 'Faculty Member'}
                              </span>
                            </div>
                            <span className="badge excellent" style={{ fontSize: '11px', fontWeight: '600' }}>
                              ID: {fac.employee_id}
                            </span>
                          </div>

                          {/* Details list */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                            {fac.qualification && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <GraduationCap size={15} style={{ color: 'var(--text-muted)' }} />
                                <span>Qualification: <strong>{fac.qualification}</strong></span>
                              </div>
                            )}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                              <Award size={15} style={{ color: 'var(--text-muted)' }} />
                              <span>Experience: <strong>{fac.experience || 0} Years</strong></span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                              <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                              <a href={`mailto:${fac.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{fac.email}</a>
                            </div>

                            {!isStudent && fac.mobile_number && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                                <span>{fac.mobile_number}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Classes / Courses Assigned */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <BookOpen size={14} style={{ color: 'var(--primary-light)' }} />
                            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                              Assigned Classes
                            </span>
                          </div>

                          {fac.courses && fac.courses.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {fac.courses.map((course) => (
                                <span 
                                  key={course.id} 
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    backgroundColor: 'var(--border)',
                                    color: 'var(--text-primary)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                  }}
                                  title={course.name}
                                >
                                  <strong>{course.code}</strong>: {course.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                              No classes assigned this semester
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>
                    No faculty profiles listed under this department.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrapper" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          No departments or faculty members match your search criteria.
        </div>
      )}
    </div>
  );
};

export default DeptFacultyClasses;
