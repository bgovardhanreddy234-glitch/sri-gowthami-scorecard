import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Mail, Shield, Building, Award, Calendar, BadgeCheck, FileSpreadsheet } from 'lucide-react';

const Profile = ({ user }) => {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user && user.role === 'Faculty' && user.faculty) {
        setLoading(true);
        try {
          const res = await api.get(`/faculty/${user.faculty.id}/history`);
          setHistoryData(res);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) return null;

  // Derive department details
  const deptName = user.department?.name || user.faculty?.department?.name || user.studentProfile?.department?.name || 'Central Administration';
  const deptCode = user.department?.code || user.faculty?.department?.code || user.studentProfile?.department?.code || 'SGI-ADMIN';

  // Role Badge Class
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin': return 'badge-needs-improvement'; // Red
      case 'HOD': return 'badge-good'; // Purple
      case 'Faculty': return 'badge-very-good'; // Blue
      case 'Student': return 'badge-excellent'; // Green
      default: return 'status-archived';
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">My Account Profile</h1>
          <p className="page-subtitle">View and manage your Sri Gowthami ERP profile credentials.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 28, alignItems: 'start' }}>
        
        {/* Profile Card Left */}
        <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--border)' }}>
            <User size={48} color="var(--primary-light)" />
            <span style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: 'var(--excellent)', width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--panel-bg)' }} title="Online status"></span>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {user.name || user.username}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: 12 }}>
            @{user.username}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <span className={`badge ${getRoleBadge(user.role)}`} style={{ fontSize: 12, padding: '4px 10px', textTransform: 'uppercase', fontWeight: 600 }}>
              {user.role}
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'left', fontSize: 13 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', marginBottom: 8 }}>
              <Shield size={14} />
              <span>Status: <strong style={{ color: 'var(--excellent)' }}>Active</strong></span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)' }}>
              <Calendar size={14} />
              <span>Academic Session: <strong>2025-2026</strong></span>
            </div>
          </div>
        </div>

        {/* Profile Details Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* General Details Panel */}
          <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BadgeCheck size={18} color="var(--primary-light)" /> Account details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Full Name</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{user.name || 'Not Configured'}</div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Email Address</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} className="text-secondary" /> {user.email}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Designated Role</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{user.role} Authority</div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Associated Department</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building size={14} className="text-secondary" /> {deptName} ({deptCode})
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Panels */}
          {user.role === 'Student' && user.studentProfile && (
            <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="var(--excellent)" /> Student Registration Profile
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Student ID</label>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                    {user.studentProfile.student_id}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Academic Year & Section</label>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.studentProfile.year} Year — Sec {user.studentProfile.section}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Mobile Number</label>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.studentProfile.mobile_number || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Profile Status</label>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    <span className="badge excellent" style={{ padding: '2px 8px', fontSize: 11 }}>
                      {user.studentProfile.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {user.role === 'Faculty' && user.faculty && (
            <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="var(--very-good)" /> Faculty Member Profile
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Employee ID</label>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                    {user.faculty.employee_id}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Designation</label>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.faculty.designation || 'Lecturer'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Qualification & Experience</label>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.faculty.qualification || 'N/A'} ({user.faculty.experience || 0} Yrs Experience)
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Mobile Number</label>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.faculty.mobile_number || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Profile Status</label>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    <span className="badge excellent" style={{ padding: '2px 8px', fontSize: 11 }}>
                      {user.faculty.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Section */}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 24, marginBottom: 16 }}>
                PERFORMANCE SCORECARD
              </h4>
              
              {loading ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading scorecard values...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>KPI Score</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-light)' }}>
                      {historyData?.records?.length > 0 ? `${historyData.records[historyData.records.length - 1].performance_score}%` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>KPI Rating</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                      {historyData?.records?.length > 0 ? historyData.records[historyData.records.length - 1].kpi_rating : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Attendance</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--excellent)' }}>
                      {historyData?.records?.length > 0 ? `${historyData.records[historyData.records.length - 1].attendance_percentage}%` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Student Feedback</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--very-good)' }}>
                      {historyData?.records?.length > 0 ? `${historyData.records[historyData.records.length - 1].student_feedback_score}/5.0` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Dept Rank</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                      {historyData?.departmentRank || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {user.role === 'HOD' && (
            <div className="form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', backgroundColor: 'var(--panel-bg)', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileSpreadsheet size={18} color="var(--good)" /> Head of Department Authorities
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                As HOD of <strong>{deptName}</strong>, you have access to enter monthly performance scorecards, verify lesson plan completions, track correction turnarounds, and monitor quality analytics for all faculties in your department.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Profile;
