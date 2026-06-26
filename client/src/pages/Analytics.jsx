import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  TrendingUp, 
  BarChart3, 
  Sparkles,
  AlertTriangle,
  Star,
  Users,
  Award
} from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [yearFilter, setYearFilter] = useState('2025-2026');
  const [semFilter, setSemFilter] = useState('Semester 1');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/summary?academicYear=${yearFilter}&semester=${semFilter}`);
      setData(response);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve reports data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [yearFilter, semFilter]);

  // Export functions
  const downloadCSV = () => {
    if (!data || !data.rankings) return;
    
    // Header Row
    const headers = [
      'Rank', 
      'Faculty Name', 
      'Employee ID', 
      'Department', 
      'Attendance %', 
      'Feedback Score (5.0)', 
      'Performance Score %', 
      'KPI Rating', 
      'Academic Year', 
      'Semester'
    ];
    
    // Convert rows to strings
    const rows = data.rankings.map((r, index) => [
      index + 1,
      `"${r.facultyName}"`,
      r.employeeId,
      `"${r.department}"`,
      r.attendance,
      r.feedback,
      r.score,
      r.rating,
      r.academicYear,
      r.semester
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Download Blob trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SGI_Faculty_Scorecard_Report_${yearFilter}_${semFilter.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <p>Assembling metrics comparisons...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} className="error" />
        <h3 className="empty-state-title">Error Loading Reports</h3>
        <p className="empty-state-desc">{error || 'Could not load reports contents.'}</p>
      </div>
    );
  }

  const { departmentComparison, rankings } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics Dashboard</h1>
          <p className="page-subtitle">Export performance audits, contrast academic departments, and track daily/monthly rank improvements.</p>
        </div>

        {/* Exports & Actions */}
        <div className="action-buttons" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={downloadCSV} title="Export spreadsheet values">
            <FileSpreadsheet size={16} />
            Export CSV / Excel
          </button>
          <button className="btn btn-primary" onClick={handlePrint} title="Generate PDF or print page">
            <Printer size={16} />
            Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Analytics selector filters & Summary widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24, marginBottom: 28 }}>
        <div className="table-controls" style={{ borderRadius: 'var(--radius-md)', margin: 0, padding: 20, height: '100%' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>SELECTION SCOPE</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select
              className="select-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ width: '100%', margin: 0 }}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>

            <select
              className="select-filter"
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              style={{ width: '100%', margin: 0 }}
            >
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} color="var(--primary-light)" /> Total Faculty Evaluated
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{data.totalRecordsCount}</span>
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={14} color="var(--excellent)" /> Overall Attendance Participation
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--excellent)' }}>{data.participationRate.toFixed(2)}%</span>
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={14} color="var(--accent)" /> Daily Ratings Submitted
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
              {data.dailyFeedbacks ? data.dailyFeedbacks.reduce((sum, d) => sum + d.count, 0) : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Comparisons charts */}
      <div className="charts-grid" style={{ marginBottom: 28 }}>
        {/* Dept performance score */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--primary-light)" />
              Dept Performance Score Comparisons (%)
            </h3>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {departmentComparison.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={departmentComparison}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="code" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                  <Bar dataKey="avgPerformanceScore" fill="var(--primary-light)" radius={[4, 4, 0, 0]} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No department score data.
              </div>
            )}
          </div>
        </div>

        {/* Dept feedback scores */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--excellent)" />
              Dept Attendance & Student Feedback Comparison
            </h3>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {departmentComparison.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={departmentComparison}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="code" />
                  <YAxis yAxisId="left" domain={[0, 100]} label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} label={{ value: 'Feedback (5.0)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgAttendance" fill="var(--excellent)" radius={[4, 4, 0, 0]} name="Avg Attendance %" />
                  <Bar yAxisId="right" dataKey="avgFeedbackScore" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Avg Student Feedback" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No comparisons statistics available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily & Monthly Trend Lines */}
      <div className="charts-grid" style={{ marginBottom: 28 }}>
        {/* Daily Feedback Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--primary-light)" />
              Daily Feedback Submissions Trend
            </h3>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {data.dailyFeedbacks && data.dailyFeedbacks.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={data.dailyFeedbacks}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: 'Feedback Count', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[1, 5]} label={{ value: 'Feedback Avg', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="var(--primary-light)" strokeWidth={2} name="Feedback Count" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="var(--accent)" strokeWidth={2} name="Avg Feedback Rating" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No daily feedback trends available.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--excellent)" />
              Monthly Feedback Quality Rating (5.0)
            </h3>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {data.monthlyTrends && data.monthlyTrends.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[1, 5]} label={{ value: 'Avg Rating', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgRating" stroke="var(--excellent)" strokeWidth={3} name="Average Monthly Rating" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No monthly rating data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Rankings list */}
      <div className="chart-card" style={{ marginBottom: 28 }}>
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Sparkles size={18} color="var(--accent)" />
          Sri Gowthami - Faculty Ranking Log
        </h3>
        
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          {rankings.length > 0 ? (
            <table className="custom-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr style={{ background: 'none' }}>
                  <th style={{ width: 80 }}>Rank</th>
                  <th>Faculty Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Attendance</th>
                  <th>Student Feedback</th>
                  <th>Performance Score</th>
                  <th>KPI Rating</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, index) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '700', color: 'var(--primary-light)' }}>
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: '600' }}>{r.facultyName}</td>
                    <td>{r.employeeId}</td>
                    <td>{r.departmentCode}</td>
                    <td>{r.attendance}%</td>
                    <td>{r.feedback} / 5.0</td>
                    <td style={{ fontWeight: '800', fontSize: 15 }}>{r.score}%</td>
                    <td>
                      <span className={`badge ${r.rating.toLowerCase().replace(/ /g, '-')}`}>
                        {r.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No ranking entries found for this evaluation term.
            </div>
          )}
        </div>
      </div>

      {/* Course Faculty Ratings Card */}
      <div className="chart-card" style={{ marginBottom: 32 }}>
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Sparkles size={18} color="var(--accent)" />
          Course-wise Faculty Feedback Scores
        </h3>
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
          {data.courseFacultyRatings && data.courseFacultyRatings.length > 0 ? (
            <table className="custom-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr style={{ background: 'none' }}>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Faculty Name</th>
                  <th>Employee ID</th>
                  <th>Feedback Count</th>
                  <th>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.courseFacultyRatings.map((cr, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', color: 'var(--primary-light)' }}>{cr.courseCode}</td>
                    <td>{cr.courseName}</td>
                    <td style={{ fontWeight: '600' }}>{cr.facultyName}</td>
                    <td>{cr.facultyEmployeeId}</td>
                    <td>{cr.count} submissions</td>
                    <td style={{ fontWeight: '800', fontSize: 15 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={14} fill="#eeb902" color="#eeb902" />
                        {cr.avgRating.toFixed(2)} / 5.0
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No course rating feedback found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Analytics;
