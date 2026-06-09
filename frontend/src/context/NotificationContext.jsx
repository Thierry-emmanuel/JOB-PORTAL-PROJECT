import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/ws`;
  }
  return 'http://localhost:8080/ws';
};
const WS_URL = getWsUrl();

const TOAST_OPTIONS = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

function dispatchRealtime(detail) {
  window.dispatchEvent(new CustomEvent('kora:realtime', { detail }));
}

function normalizeRole(role) {
  return (role || '').toUpperCase().replace('ROLE_', '');
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const clientRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const role = normalizeRole(user.role);
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/${user.id}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          const title = payload.title || 'Notification';
          const body = payload.message || payload.body || '';
          toast.info(`${title}: ${body}`, TOAST_OPTIONS);
          dispatchRealtime({
            ...payload,
            event: payload.type || 'NOTIFICATION',
            type: payload.type,
          });
        } catch {
          toast.info('You have a new notification', TOAST_OPTIONS);
        }
      });

      if (role === 'EMPLOYER') {
        client.subscribe(`/topic/applications/employer/${user.id}`, (message) => {
          try {
            dispatchRealtime(JSON.parse(message.body));
          } catch { /* ignore */ }
        });
        client.subscribe(`/topic/interviews/employer/${user.id}`, (message) => {
          try {
            dispatchRealtime(JSON.parse(message.body));
          } catch { /* ignore */ }
        });
      }

      if (role === 'JOB_SEEKER') {
        client.subscribe(`/topic/applications/seeker/${user.id}`, (message) => {
          try {
            dispatchRealtime(JSON.parse(message.body));
          } catch { /* ignore */ }
        });
        client.subscribe(`/topic/interviews/seeker/${user.id}`, (message) => {
          try {
            dispatchRealtime(JSON.parse(message.body));
          } catch { /* ignore */ }
        });
      }
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] error:', frame.headers['message']);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, user?.id, user?.role]);

  return (
    <NotificationContext.Provider value={clientRef}>
      {children}
      <ToastContainer limit={5} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
