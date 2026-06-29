import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ── Notification type → icon / accent colour mapping ──────────────────────────
const TYPE_META = {
  appointment_booked:    { icon: '🔔', color: '#3b82f6' },
  appointment_confirmed: { icon: '✅', color: '#10b981' },
  appointment_cancelled: { icon: '❌', color: '#ef4444' },
  doctor_verified:       { icon: '👨‍⚕️', color: '#10b981' },
  doctor_rejected:       { icon: '⚠️', color: '#f59e0b' },
  payment_success:       { icon: '💳', color: '#8b5cf6' },
};

const getMeta = (type) => TYPE_META[type] || { icon: '🔔', color: '#64748b' };

// Relative timestamp — e.g. "2 minutes ago"
const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

// ── NotificationBell ───────────────────────────────────────────────────────────
const NotificationBell = () => {
  const { unreadCount, setUnreadCount, refreshNotifications } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]         = useState(false);
  const dropdownRef                   = useRef(null);

  // ── Fetch latest 5 notifications when dropdown opens ──────────────────────
  const fetchLatest = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/notifications/latest');
      setNotifications(data);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open) fetchLatest();
  }, [open, fetchLatest]);

  // ── Close dropdown when clicking outside ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Mark single as read ───────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      refreshNotifications(); // sync badge count
    } catch { /* ignore */ }
  };

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.4rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          color: '#374151',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <Bell size={20} />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              borderRadius: '9999px',
              fontSize: '0.6rem',
              fontWeight: 800,
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              boxShadow: '0 0 0 2px white',
              animation: 'bellPulse 1.5s ease infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          id="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: '360px',
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1rem',
            boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
            border: '1px solid rgba(226,232,240,0.8)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'dropdownSlide 0.18s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.9rem 1rem 0.6rem',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: '0.4rem',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '9999px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.4rem',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#2563eb',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const meta = getMeta(n.type);
                return (
                  <div
                    key={n._id}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid #f8fafc',
                      background: n.isRead ? 'transparent' : 'rgba(37,99,235,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => !n.isRead && markRead(n._id)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(37,99,235,0.04)')
                    }
                  >
                    {/* Icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: '36px',
                        height: '36px',
                        borderRadius: '9999px',
                        background: `${meta.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                      }}
                    >
                      {meta.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: n.isRead ? 500 : 700,
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          marginBottom: '0.15rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.775rem',
                          color: '#64748b',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: meta.color,
                          marginTop: '0.4rem',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.65rem 1rem',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#2563eb',
                fontWeight: 600,
              }}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes bellPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
