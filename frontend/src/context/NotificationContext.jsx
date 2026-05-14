import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        debug: (str) => {
          // console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        // console.log('Connected to WebSocket');
        client.subscribe(`/topic/notifications/${user.id}`, (message) => {
          const notification = JSON.parse(message.body);
          toast.info(`${notification.title}: ${notification.message}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        });
      };

      client.onStompError = (frame) => {
        console.error('STOMP error', frame.headers['message']);
      };

      client.activate();
      setStompClient(client);

      return () => {
        client.deactivate();
      };
    }
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider value={{ stompClient }}>
      {children}
      <ToastContainer />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
