import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  Mail, 
  Hash, 
  Building2, 
  Activity, 
  Calendar,
  AlertTriangle,
  History,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const FacultyDetail = ({ facultyId, setCurrentTab }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!facultyId) return;
      try {
        const response = await api.get(`/faculty/${facultyId}/history`);
        setData(response);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch faculty evaluation history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [facultyId]);

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <p>Loading historical records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} className="error" />
        <h3 className="empty-state-title">Error Loading Details</h3>
        <p className="empty-state-desc">{error || 'Could not load details.'}</p>
        <button className="btn btn-secondary" onClick={() => setCurrentTab('records')}>
          <ArrowLeft size={16} /> Back to Scorecard
        </button>
      </div>
    );
  }

  const { faculty, records } = data;

  // Format chart data for Line Chart
  const chartData = records.map(r => ({
    name: `${r.academic_year.replace('20', '')} ${r.semester.replace('Semester ', 'S')}`,
    Score: r.performance_score,
    Feedback: Math.round(((r.student_feedback_score / 5) * 100) * 10) / 10,
    Attendance: r.attendance_percentage
  }));

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary" onClick={() => setCurrentTab('records')} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">{faculty.name}</h1>
            <p className="page-subtitle">Detailed evaluation analytics and audit trial history.</p>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Side: Profile Information */}
        <div className="profile-card">
          <div className="profile-avatar-large">
            {getInitials(faculty.name)}
          </div>
          <h2 className="profile-name">{faculty.name}</h2>
          <div className="profile-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hash size={14} /> ID: {faculty.employee_id}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} /> {faculty.email}
            </span>
          </div>

          <span className={`badge status-${faculty.status.toLowerCase()}`}>
            {faculty.status} Faculty
          </span>

          <div className="info-divider"></div>

          <ul className="profile-details-list">
            <li className="profile-detail-item">
              <span className="profile-detail-label">Department</span>
              <span className="profile-detail-value">{faculty.department?.name}</span>
            </li>
            <li className="profile-detail-item">
              <span className="profile-detail-label">Dept Code</span>
              <span className="profile-detail-value">{faculty.department?.code}</span>
            </li>
            <li className="profile-detail-item">
              <span className="profile-detail-label">Total Scorecards</span>
              <span className="profile-detail-value">{records.length}</span>
            </li>
          </ul>
        </div>

        {/* Right Side: Trends & Logs */}
        <div className="history-section">
          
          {/* KPI Line Chart */}
          <div className="chart-card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Activity size={20} color="var(--primary-light)" />
              Performance KPI Trends (Score %)
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Score" stroke="var(--primary-light)" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Attendance" stroke="var(--excellent)" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  Add evaluation scorecards to view line graph trends.
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail Activity Timeline */}
          <div className="history-card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <History size={20} color="var(--accent)" />
              Scorecard Audit Trail & Activity Logs
            </h3>

            {records.length > 0 ? (
              <ul className="timeline">
                {records.slice().reverse().map((rec, index) => (
                  <li key={rec.id} className={`timeline-item ${index === 0 ? 'active' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} />
                          {rec.academic_year} • {rec.semester}
                        </span>
                        <span className={`badge ${rec.kpi_rating.toLowerCase().replace(/ /g, '-')}`}>
                          Score: {rec.performance_score}% ({rec.kpi_rating})
                        </span>
                      </div>

                      <div className="timeline-body">
                        <div style={{ marginBottom: 6 }}>
                          <strong>Remarks:</strong> {rec.remarks || 'No evaluator remarks recorded.'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span>Attendance: {rec.attendance_percentage}%</span>
                          <span>Lesson Plan: {rec.lesson_plan_status}</span>
                          <span>Feedback: {rec.student_feedback_score}/5.0</span>
                          <span>Course Progress: {rec.course_completion_progress}%</span>
                        </div>
                        <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <UserCheck size={12} />
                            Evaluated by: {rec.creator?.username || 'System Seed'}
                          </span>
                          {rec.updater && (
                            <span>Updated by: {rec.updater?.username}</span>
                          )}
                          <span>Updated: {new Date(rec.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                No audit logs or actions found.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FacultyDetail;
