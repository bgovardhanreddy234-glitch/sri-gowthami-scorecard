import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { AlertCircle, FileText, UserCheck, Clock, Terminal } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/audit-logs');
        setLogs(response.logs || []);
      } catch (err) {
        console.error(err);
        setError('Could not retrieve audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDetails = (detailsStr) => {
    try {
      const obj = JSON.parse(detailsStr);
      return JSON.stringify(obj, null, 2);
    } catch {
      return detailsStr;
    }
  };

  const getBadgeColor = (action) => {
    if (action.includes('CREATE')) return 'excellent';
    if (action.includes('UPDATE')) return 'very-good';
    if (action.includes('DELETE')) return 'needs-improvement';
    return 'good';
  };

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
        <p>Loading security audit trails...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Security & Action Audit Trail</h1>
          <p className="page-subtitle">Track scorecard entries, edits, deletions, and operator sessions in real-time.</p>
        </div>
      </div>

      {error && (
        <div className="alert-bar error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="table-wrapper" style={{ borderRadius: 'var(--radius-md)' }}>
        {logs.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Time & Date</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Target Object</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: '500' }}>
                        <Clock size={14} className="text-secondary" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UserCheck size={14} className="text-secondary" />
                        <div>
                          <span style={{ fontWeight: '600' }}>{log.user?.username || 'SYSTEM'}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block' }}>
                            Role: {log.user?.role || 'Daemon'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>
                      {log.target_table ? `${log.target_table} #${log.target_id}` : 'N/A'}
                    </td>
                    <td>
                      {log.details ? (
                        <button 
                          className="btn-icon" 
                          style={{ width: 'auto', padding: '0 8px', height: 26, fontSize: 11 }}
                          onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        >
                          <Terminal size={12} style={{ marginRight: 4 }} />
                          {expandedLogId === log.id ? 'Hide Data' : 'Inspect Data'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No snapshot details</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded JSON details section */}
                  {expandedLogId === log.id && log.details && (
                    <tr style={{ background: 'var(--primary-tint)' }}>
                      <td colSpan="5" style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 8 }}>
                          <FileText size={14} /> Action Snapshot Payload Details:
                        </div>
                        <pre style={{
                          backgroundColor: 'var(--bg-color)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 16,
                          fontSize: 12,
                          overflowX: 'auto',
                          maxHeight: 300,
                          lineHeight: 1.5,
                          fontFamily: 'Consolas, Monaco, monospace',
                          color: 'var(--text-primary)'
                        }}>
                          {formatDetails(log.details)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ border: 'none', borderRadius: 0 }}>
            <h3 className="empty-state-title">No Audit Logs Found</h3>
            <p className="empty-state-desc">The system action logs are currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
