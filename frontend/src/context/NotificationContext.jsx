import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

const TOAST_OPTIONS = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  // Use a ref instead of state — the STOMP client is not UI state, it doesn't need to re-render.
  const clientRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/${user.id}`, (message) => {
        try {
          const { title, message: body } = JSON.parse(message.body);
          toast.info(`${title}: ${body}`, TOAST_OPTIONS);
        } catch {
          toast.info('You have a new notification', TOAST_OPTIONS);
        }
      });
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
  }, [isAuthenticated, user?.id]); // only re-connect when the user's ID actually changes

  return (
    <NotificationContext.Provider value={clientRef}>
      {children}
      <ToastContainer limit={5} />
    </NotificationContext.Provider>
  );
};

/** Returns the raw STOMP client ref (rarely needed by consumers). */
export const useNotifications = () => useContext(NotificationContext);
