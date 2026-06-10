/**
 * NotificationContext.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Platform-wide STOMP / WebSocket provider.
 *
 * What this file owns
 * ───────────────────
 * 1. Opens ONE STOMP connection per authenticated session.
 * 2. Subscribes to role-specific topics (EMPLOYER / JOB_SEEKER / ADMIN).
 * 3. Dispatches every incoming frame as a `kora:realtime` CustomEvent so
 *    any hook (useRealtimeRefresh, etc.) can react without prop-drilling.
 * 4. Shows react-toastify toasts for human-readable notifications.
 *
 * Regression prevention
 * ─────────────────────
 * • Topic paths are unchanged (/topic/applications/employer/:id, etc.).
 * • `dispatchRealtime` shape is unchanged — hooks consuming
 *   `kora:realtime` continue to work without modification.
 * • HTTP fallback paths in hooks are untouched.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

/* ── Context ─────────────────────────────────────────────────────── */
const NotificationContext = createContext(null);

/* ── WebSocket URL resolution ────────────────────────────────────── */
const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/ws`;
  return 'http://localhost:8080/ws';
};
const WS_URL = getWsUrl();

/* ── Toast configuration ─────────────────────────────────────────── */
const TOAST_OPTIONS = {
  position:        'top-right',
  autoClose:       5000,
  hideProgressBar: false,
  closeOnClick:    true,
  pauseOnHover:    true,
  draggable:       true,
};

/* ── Utility: dispatch kora:realtime CustomEvent to window ───────── */
function dispatchRealtime(detail) {
  window.dispatchEvent(new CustomEvent('kora:realtime', { detail }));
}

/* ── Utility: normalise role strings ─────────────────────────────── */
function normalizeRole(role) {
  return (role || '').toUpperCase().replace('ROLE_', '');
}

/* ═════════════════════════════════════════════════════════════════════
   NotificationProvider
   ═════════════════════════════════════════════════════════════════════ */
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const clientRef = useRef(null);

  useEffect(() => {
    /* Guard: only connect when a real session exists */
    if (!isAuthenticated || !user?.id) return;

    const role = normalizeRole(user.role);

    /* ── Create STOMP client over SockJS ──────────────────────────── */
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay:   5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    /* ── On connected: subscribe to role-specific topics ─────────── */
    client.onConnect = () => {
      /* ① Universal notification topic — visible to all roles */
      client.subscribe(`/topic/notifications/${user.id}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          const title   = payload.title   || 'Notification';
          const body    = payload.message || payload.body || '';
          toast.info(`${title}${body ? ': ' + body : ''}`, TOAST_OPTIONS);
          dispatchRealtime({
            ...payload,
            event: payload.type || 'NOTIFICATION',
            type:  payload.type,
          });
        } catch {
          toast.info('You have a new notification', TOAST_OPTIONS);
        }
      });

      /* ② Employer-specific topics */
      if (role === 'EMPLOYER') {
        /* New application submitted — instant update on employer dashboard */
        client.subscribe(`/topic/applications/employer/${user.id}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            /* Surface a toast for new applications so the employer notices */
            if (payload.event === 'APPLICATION_CREATED') {
              toast.success('📩 New application received!', {
                ...TOAST_OPTIONS,
                autoClose: 6000,
              });
            }
            dispatchRealtime(payload);
          } catch { /* silently ignore malformed frames */ }
        });

        /* Interview events for the employer */
        client.subscribe(`/topic/interviews/employer/${user.id}`, (message) => {
          try {
            dispatchRealtime(JSON.parse(message.body));
          } catch { /* ignore */ }
        });
      }

      /* ③ Job Seeker-specific topics */
      if (role === 'JOB_SEEKER') {
        /* Application status changes — update employee dashboard in real-time */
        client.subscribe(`/topic/applications/seeker/${user.id}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.event === 'APPLICATION_STATUS_CHANGED') {
              toast.info('📋 Your application status was updated.', TOAST_OPTIONS);
            }
            dispatchRealtime(payload);
          } catch { /* ignore */ }
        });

        /* Interview events for the job seeker */
        client.subscribe(`/topic/interviews/seeker/${user.id}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.event === 'INTERVIEW_SCHEDULED') {
              toast.success('📅 You have a new interview scheduled!', {
                ...TOAST_OPTIONS,
                autoClose: 7000,
              });
            }
            dispatchRealtime(payload);
          } catch { /* ignore */ }
        });
      }

      /* ④ Admin-specific topics — platform-wide activity feed */
      if (role === 'ADMIN') {
        /* Admins get all application events for platform monitoring */
        client.subscribe('/topic/applications/admin', (message) => {
          try {
            dispatchRealtime(JSON.parse(message.body));
          } catch { /* ignore */ }
        });
      }
    };

    /* ── Error handler ──────────────────────────────────────────── */
    client.onStompError = (frame) => {
      console.error('[STOMP] error:', frame.headers['message']);
    };

    client.onWebSocketError = (event) => {
      console.warn('[STOMP] WebSocket error — will auto-reconnect', event);
    };

    /* ── Activate and store ref ──────────────────────────────────── */
    client.activate();
    clientRef.current = client;

    /* ── Cleanup on unmount / auth change ───────────────────────── */
    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, user?.id, user?.role]);

  return (
    <NotificationContext.Provider value={clientRef}>
      {children}
      {/* Limit simultaneous toasts to avoid UI overflow */}
      <ToastContainer limit={5} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);