import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  Users, 
  Award, 
  MessageSquare, 
  BellRing, 
  AlertTriangle, 
  ChevronRight, 
  TrendingUp 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const Dashboard = ({ user, setCurrentTab, setSelectedFacultyId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setData(response.summary);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <p>Loading school scorecard summary...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} className="error" />
        <h3 className="empty-state-title">Error Loading Data</h3>
        <p className="empty-state-desc">{error || 'Could not fetch dashboard contents.'}</p>
      </div>
    );
  }

  // Formatting chart data for Rating Distribution (Pie Chart)
  const kpiDataColors = {
    'Excellent': '#10b981',
    'Very Good': '#3b82f6',
    'Good': '#8b5cf6',
    'Average': '#f59e0b',
    'Needs Improvement': '#ef4444'
  };

  const pieData = Object.keys(data.ratingDistribution || {}).map(key => ({
    name: key,
    value: data.ratingDistribution[key],
    color: kpiDataColors[key] || '#cccccc'
  })).filter(item => item.value > 0);

  // Formatting chart data for Top Performers (Bar Chart)
  const barData = (data.topPerformers || []).map(tp => ({
    name: tp.facultyName.replace(/Dr\.|Mr\.|Mrs\.|Prof\./g, '').trim(),
    Score: tp.score
  }));

  const handleFacultyView = (facultyName) => {
    // Navigate to history page if we can map it
    // For simplicity, we can redirect HOD/Admin to the scorecard page with filters
    setCurrentTab('records');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sri Gowthami Scorecard</h1>
          <p className="page-subtitle">Welcome back, {user.role}! Here's the performance dashboard summary.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.avgScore}%</span>
            <span className="stat-label">Avg Performance Score</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <MessageSquare size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.avgFeedback} / 5.0</span>
            <span className="stat-label">Avg Feedback Score</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <BellRing size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{data.alertsCount}</span>
            <span className="stat-label">System Performance Alerts</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">KPI Rating Distribution</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Faculty`, 'RatingCount']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="loading-spinner-wrapper" style={{ height: '100%', padding: 0 }}>
                <p>No historical rating distribution available.</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Top Performing Faculty (Score %)</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {barData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Performance Score']} />
                  <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                    {data.topPerformers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={kpiDataColors[entry.rating] || '#134074'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="loading-spinner-wrapper" style={{ height: '100%', padding: 0 }}>
                <p>No performer ranking data found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Split Alert & Rank panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 24 }}>
        {/* Low Performance Alerts */}
        <div className="alerts-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} color="var(--needs-improvement)" />
              Performance & Compliance Alerts
            </h3>
            <span className="badge badge-needs-improvement">{data.alertsCount} Alert(s)</span>
          </div>

          <div className="alerts-list">
            {data.alerts && data.alerts.length > 0 ? (
              data.alerts.map((alert, idx) => (
                <div key={idx} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-content">
                    <div className="alert-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{alert.type}</span>
                      <span style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase' }}>{alert.severity}</span>
                    </div>
                    <div>{alert.message}</div>
                    <div className="alert-faculty">
                      {alert.facultyName} ({alert.employeeId}) • Dept: {alert.department}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                🎉 All faculty parameters are compliant with thresholds.
              </div>
            )}
          </div>
        </div>

        {/* Top Performers Table List */}
        <div className="chart-card">
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={20} color="var(--excellent)" />
            Top Performance Rankings
          </h3>
          <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            {data.topPerformers && data.topPerformers.length > 0 ? (
              <table className="custom-table" style={{ minWidth: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'none' }}>
                    <th style={{ padding: '10px 12px' }}>Name</th>
                    <th style={{ padding: '10px 12px' }}>Dept</th>
                    <th style={{ padding: '10px 12px' }}>Score</th>
                    <th style={{ padding: '10px 12px' }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPerformers.map((tp, idx) => (
                    <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => handleFacultyView(tp.facultyName)}>
                      <td style={{ padding: '12px' }}>{tp.facultyName}</td>
                      <td style={{ padding: '12px' }}>{tp.department}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{tp.score}%</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${tp.rating.toLowerCase().replace(/ /g, '-')}`}>
                          {tp.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                No rankings available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
