import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import api from '../utils/api';

// ── SocketContext ──────────────────────────────────────────────────────────────
// Provides a single Socket.IO connection across the entire application.
// • Connects when user logs in, disconnects on logout.
// • Listens for `new_notification` events and updates the unread badge.
// • Exposes refreshNotifications() so any component can force a badge refresh.

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Toast helper — maps notification type to a styled react-hot-toast call
const showNotificationToast = (notification) => {
  const icons = {
    appointment_booked:    '🔔',
    appointment_confirmed: '✅',
    appointment_cancelled: '❌',
    doctor_verified:       '👨‍⚕️',
    doctor_rejected:       '⚠️',
    payment_success:       '💳',
  };
  const icon = icons[notification.type] || '🔔';

  toast(`${icon} ${notification.title}\n${notification.message}`, {
    duration: 5000,
    style: {
      background: '#0f172a',
      color: '#f8fafc',
      borderRadius: '0.75rem',
      padding: '0.85rem 1rem',
      fontSize: '0.875rem',
      maxWidth: '380px',
      lineHeight: '1.5',
    },
  });
};

const SOCKET_URL = 'http://localhost:5000';   // same host as the backend

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  // socketRef prevents stale closure issues and avoids re-renders from a useState
  const socketRef = useRef(null);

  const [unreadCount, setUnreadCount]     = useState(0);
  const [isConnected, setIsConnected]     = useState(false);

  // ── Fetch unread count from REST (called on mount + after mark-as-read) ────
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch {
      // Silently ignore — badge will just show stale value
    }
  }, [user]);

  // ── Connect / Disconnect based on auth state ────────────────────────────────
  useEffect(() => {
    if (!user?.token) {
      // No authenticated user → ensure socket is disconnected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setUnreadCount(0);
      }
      return;
    }

    // Prevent duplicate connections (React StrictMode double-invokes effects)
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      // Pass JWT in handshake auth (not query string)
      auth: { token: user.token },
      // Reconnect automatically on network drops
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      // Sync unread count from DB on (re)connect in case missed events
      refreshNotifications();
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // ── Real-time notification listener ────────────────────────────────────
    socket.on('new_notification', (notification) => {
      // Increment badge immediately without a round-trip
      setUnreadCount((prev) => prev + 1);
      // Show toast
      showNotificationToast(notification);
    });

    // Load current unread count from DB for badge on fresh page load
    refreshNotifications();

    // Cleanup: disconnect when user logs out or component unmounts
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.token, refreshNotifications]);

  const value = {
    socket:               socketRef.current,
    isConnected,
    unreadCount,
    setUnreadCount,
    refreshNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
