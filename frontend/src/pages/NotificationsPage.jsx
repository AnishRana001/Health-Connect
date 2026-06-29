import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

// ── Type metadata ──────────────────────────────────────────────────────────────
const TYPE_META = {
  appointment_booked:    { icon: '🔔', color: '#3b82f6', bg: '#eff6ff', label: 'Appointment Booked'    },
  appointment_confirmed: { icon: '✅', color: '#10b981', bg: '#f0fdf4', label: 'Appointment Confirmed'  },
  appointment_cancelled: { icon: '❌', color: '#ef4444', bg: '#fef2f2', label: 'Appointment Cancelled'  },
  doctor_verified:       { icon: '👨‍⚕️', color: '#10b981', bg: '#f0fdf4', label: 'Doctor Verified'       },
  doctor_rejected:       { icon: '⚠️', color: '#f59e0b', bg: '#fffbeb', label: 'Verification Rejected'  },
  payment_success:       { icon: '💳', color: '#8b5cf6', bg: '#faf5ff', label: 'Payment Success'        },
};

const getMeta = (type) =>
  TYPE_META[type] || { icon: '🔔', color: '#64748b', bg: '#f8fafc', label: 'Notification' };

const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

// ── NotificationsPage ──────────────────────────────────────────────────────────
const NotificationsPage = () => {
  const { setUnreadCount, refreshNotifications } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [total, setTotal]                 = useState(0);
  const [markingAll, setMarkingAll]       = useState(false);

  const LIMIT = 10;

  // ── Fetch page ───────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/notifications?page=${p}&limit=${LIMIT}`);
      setNotifications(data.notifications);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(page); }, [page, fetchPage]);

  // ── Mark single as read ──────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      refreshNotifications();
    } catch { /* ignore */ }
  };

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
    setMarkingAll(false);
  };

  // ── Unread count for this page ───────────────────────────────────────────────
  const pageUnread = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '2rem 1rem 4rem',
        minHeight: '80vh',
      }}
    >
      {/* ── Page header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Bell size={22} color="#2563eb" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Notifications
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {total} notification{total !== 1 ? 's' : ''} in total
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={() => fetchPage(page)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
              padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem',
              fontWeight: 600, color: '#374151', transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          {pageUnread > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', border: 'none',
                borderRadius: '0.5rem', padding: '0.45rem 0.85rem',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'white',
              }}
            >
              <CheckCheck size={14} />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      {/* ── Notification cards ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '88px', borderRadius: '0.85rem',
                background: '#e2e8f0', animation: 'skeleton 1.5s ease infinite',
              }}
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'white', borderRadius: '1rem',
            border: '1px solid #e2e8f0', color: '#94a3b8',
          }}
        >
          <Bell size={40} color="#e2e8f0" style={{ marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', color: '#64748b' }}>No notifications yet</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            You'll see real-time updates here when activity happens.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {notifications.map((n) => {
            const meta = getMeta(n.type);
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  padding: '1rem 1.25rem',
                  background: 'white',
                  borderRadius: '0.85rem',
                  border: `1px solid ${n.isRead ? '#f1f5f9' : meta.color + '30'}`,
                  borderLeft: `4px solid ${n.isRead ? '#e2e8f0' : meta.color}`,
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                  boxShadow: n.isRead ? '0 1px 4px rgba(0,0,0,0.03)' : '0 2px 12px rgba(0,0,0,0.07)',
                }}
                onMouseEnter={(e) => {
                  if (!n.isRead) e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Icon bubble */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '42px', height: '42px',
                    borderRadius: '50%',
                    background: meta.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.15rem',
                  }}
                >
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontWeight: n.isRead ? 500 : 700,
                        fontSize: '0.9rem',
                        color: '#0f172a',
                      }}
                    >
                      {n.title}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        background: meta.bg,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    {!n.isRead && (
                      <span
                        style={{
                          fontSize: '0.68rem', fontWeight: 600,
                          padding: '0.1rem 0.45rem', borderRadius: '9999px',
                          background: '#eff6ff', color: '#2563eb',
                        }}
                      >
                        • Unread — click to mark read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: '0.75rem', marginTop: '2rem',
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
              padding: '0.45rem 0.85rem', cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem', fontWeight: 600, color: page === 1 ? '#94a3b8' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
              padding: '0.45rem 0.85rem', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              color: page === totalPages ? '#94a3b8' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes skeleton {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
