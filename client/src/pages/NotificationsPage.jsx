import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Bell, BellOff, CheckCircle2, AlertTriangle, AlertCircle, Calendar, Trash2 } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notification feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setSuccess('All notifications marked as read.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to mark all as read.');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setSuccess('All notifications cleared successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to clear notifications.');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'ATTENDANCE_ALERT':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'FEEDBACK_ALERT':
        return <AlertCircle size={18} color="#ef4444" />;
      case 'LESSON_PLAN_ALERT':
      case 'TEST_CORRECTION_ALERT':
        return <AlertCircle size={18} color="#8b5cf6" />;
      case 'KPI_ALERT':
        return <AlertCircle size={18} color="#ef4444" />;
      default:
        return <Bell size={18} color="var(--text-secondary)" />;
    }
  };

  const formatTime = (timeStr) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={24} className={unreadCount > 0 ? 'pulse' : ''} />
            Alerts & Notifications Center
            {unreadCount > 0 && (
              <span className="badge badge-needs-improvement" style={{ fontSize: 13, padding: '4px 10px' }}>
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="page-subtitle">ERP compliance alerts and performance threshold indicators feed.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllAsRead}>
              <CheckCircle2 size={16} /> Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className="btn btn-primary" 
              onClick={clearAllNotifications}
              style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="alert-bar success" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-bar error" style={{ padding: '12px 18px', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <span>{error}</span>
        </div>
      )}

      {/* Notifications list feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Loading notification feed...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                backgroundColor: 'var(--panel-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '18px 20px',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
                opacity: n.is_read ? 0.75 : 1,
                borderLeft: n.is_read ? '1px solid var(--border)' : '4px solid #ef4444',
                transition: 'opacity 0.2s, border-left-color 0.2s'
              }}
            >
              <div style={{ marginTop: 2 }}>{getAlertIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {formatTime(n.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
              </div>

              {!n.is_read && (
                <button 
                  className="page-btn" 
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    position: 'absolute',
                    right: 20,
                    bottom: 12,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => markAsRead(n.id)}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ padding: '80px 40px' }}>
            <BellOff size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 className="empty-state-title">No Alerts Filed</h3>
            <p className="empty-state-desc">All departments are currently compliant with metric rules.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
