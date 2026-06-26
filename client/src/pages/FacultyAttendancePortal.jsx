import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Calendar as CalendarIcon, CheckCircle, XCircle, FileText, Download, Printer, ShieldAlert } from 'lucide-react';

const FacultyAttendancePortal = ({ user }) => {
  const [summary, setSummary] = useState({
    presentDays: 0,
    absentDays: 0,
    totalWorkingDays: 0,
    attendancePercentage: 0
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar states
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2025, 2026, 2027];

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/faculty-attendance/my-summary');
      setSummary(response.summary || {
        presentDays: 0,
        absentDays: 0,
        totalWorkingDays: 0,
        attendancePercentage: 0
      });
      setHistory(response.history || []);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve your attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Filter history based on selected month and year
  const filteredHistory = history.filter(item => {
    const itemDate = new Date(item.date);
    return (itemDate.getMonth() + 1) === currentMonth && itemDate.getFullYear() === currentYear;
  });

  // Calculate calendar days for the selected month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    // 0 = Sunday, 1 = Monday, ...
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  // Generate calendar grid array
  const calendarGrid = [];
  // Fill initial empty cells
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.push(null);
  }
  // Fill dates
  for (let d = 1; d <= daysInMonth; d++) {
    calendarGrid.push(d);
  }

  // Find attendance status for a calendar day
  const getAttendanceForDay = (day) => {
    if (!day) return null;
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return history.find(item => item.date === formattedDate);
  };

  // Export CSV / Excel format
  const exportToCSV = () => {
    const headers = ['Date', 'Day of Week', 'Status', 'Remarks'];
    const rows = history.map(item => {
      const dateObj = new Date(item.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      return [
        item.date,
        dayName,
        item.status,
        item.remarks || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SGI_Attendance_Report_${months[currentMonth - 1]}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF report logic
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const recordsHTML = history.map(item => {
      const dateObj = new Date(item.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.date}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${dayName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${item.status === 'Present' ? '#10b981' : '#ef4444'};">${item.status}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.remarks || '-'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report - Sri Gowthami Educational Institutions</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            h1 { text-align: center; color: #0b2545; margin-bottom: 5px; }
            h3 { text-align: center; color: #666; margin-top: 0; margin-bottom: 30px; }
            .summary-box { display: flex; justify-content: space-around; background: #f0f4f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 20px; font-weight: bold; color: #0b2545; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0b2545; color: white; padding: 12px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Sri Gowthami Educational Institutions</h1>
          <h3>Faculty Attendance Report — ${user.name}</h3>
          
          <div class="summary-box">
            <div class="summary-item">
              <div class="summary-value">${summary.presentDays}</div>
              <div>Present Days</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summary.absentDays}</div>
              <div>Absent Days</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summary.totalWorkingDays}</div>
              <div>Working Days</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${summary.attendancePercentage}%</div>
              <div>Attendance Percentage</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day of Week</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHTML}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">My Attendance & Calendar Portal</h1>
          <p className="page-subtitle">Track daily logs, view attendance percentages, check historical records, and print audit summaries.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={exportToCSV} disabled={loading || history.length === 0}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={printReport} disabled={loading || history.length === 0}>
            <Printer size={15} /> Print Summary (PDF)
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-bar error" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px auto' }}></div>
          Loading attendance metrics...
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="dashboard-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-icon info" style={{ backgroundColor: 'var(--excellent-bg)', color: 'var(--excellent)' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{summary.presentDays}</span>
                <span className="stat-label">Present Days</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning" style={{ backgroundColor: 'var(--needs-improvement-bg)', color: 'var(--needs-improvement)' }}>
                <XCircle size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{summary.absentDays}</span>
                <span className="stat-label">Absent Days</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon info">
                <CalendarIcon size={24} />
              </div>
              <div className="stat-details">
                <span className="stat-value">{summary.totalWorkingDays}</span>
                <span className="stat-label">Total Working Days</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: summary.attendancePercentage >= 75 ? 'var(--excellent-bg)' : 'var(--needs-improvement-bg)', color: summary.attendancePercentage >= 75 ? 'var(--excellent)' : 'var(--needs-improvement)' }}>
                <span style={{ fontSize: 16, fontWeight: 'bold' }}>%</span>
              </div>
              <div className="stat-details">
                <span className="stat-value">{summary.attendancePercentage}%</span>
                <span className="stat-label">Attendance Percentage</span>
              </div>
            </div>
          </div>

          {/* Split Layout: Calendar View & History Log */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28 }}>
            
            {/* Left: Monthly Calendar View */}
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="chart-title" style={{ margin: 0 }}>Attendance Calendar</h3>
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <select 
                    className="select-filter" 
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(Number(e.target.value))}
                    style={{ padding: '6px 12px', minWidth: 120 }}
                  >
                    {months.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>

                  <select 
                    className="select-filter" 
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    style={{ padding: '6px 12px', minWidth: 90 }}
                  >
                    {years.map((y, idx) => (
                      <option key={idx} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid Header days of week */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Grid cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {calendarGrid.map((day, idx) => {
                  const dayAttendance = getAttendanceForDay(day);
                  const isSunday = idx % 7 === 0;

                  let bgColor = 'var(--bg-color)';
                  let textColor = 'var(--text-primary)';
                  let border = '1px solid var(--border)';
                  let titleStr = '';

                  if (dayAttendance) {
                    if (dayAttendance.status === 'Present') {
                      bgColor = 'var(--excellent-bg)';
                      textColor = 'var(--excellent)';
                      border = '1px solid var(--excellent)';
                      titleStr = 'Present' + (dayAttendance.remarks ? `: ${dayAttendance.remarks}` : '');
                    } else {
                      bgColor = 'var(--needs-improvement-bg)';
                      textColor = 'var(--needs-improvement)';
                      border = '1px solid var(--needs-improvement)';
                      titleStr = 'Absent' + (dayAttendance.remarks ? `: ${dayAttendance.remarks}` : '');
                    }
                  } else if (day && isSunday) {
                    bgColor = 'rgba(0,0,0,0.03)';
                    textColor = 'var(--text-muted)';
                    titleStr = 'Sunday Holiday';
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        height: 50,
                        borderRadius: 8,
                        backgroundColor: bgColor,
                        color: textColor,
                        border: border,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: 14,
                        opacity: day ? 1 : 0,
                        cursor: day ? 'pointer' : 'default',
                        position: 'relative',
                        transition: 'transform 0.15s ease'
                      }}
                      title={titleStr}
                    >
                      {day}
                      {dayAttendance && (
                        <div style={{
                          position: 'absolute',
                          bottom: 4,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: dayAttendance.status === 'Present' ? 'var(--excellent)' : 'var(--needs-improvement)'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend details */}
              <div style={{ display: 'flex', gap: 20, marginTop: 20, justifyContent: 'center', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: 'var(--excellent-bg)', border: '1px solid var(--excellent)' }}></div>
                  <span>Present Days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: 'var(--needs-improvement-bg)', border: '1px solid var(--needs-improvement)' }}></div>
                  <span>Absent Days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}></div>
                  <span>Sunday Holiday</span>
                </div>
              </div>
            </div>

            {/* Right: History Log List */}
            <div className="chart-card">
              <h3 className="chart-title" style={{ marginBottom: 16 }}>Attendance Logs</h3>
              <div style={{ maxHeight: 375, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item, idx) => {
                    const dateObj = new Date(item.date);
                    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                    return (
                      <div 
                        key={item.id} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          backgroundColor: 'var(--bg-color)',
                          borderRadius: 8,
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: 13 }}>
                            {item.date} — {dayOfWeek}
                          </div>
                          {item.remarks && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              Remarks: {item.remarks}
                            </div>
                          )}
                        </div>
                        
                        <span className={`badge ${item.status === 'Present' ? 'excellent' : 'needs-improvement'}`}>
                          {item.status}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No attendance logs marked for {months[currentMonth - 1]} {currentYear}.
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default FacultyAttendancePortal;
