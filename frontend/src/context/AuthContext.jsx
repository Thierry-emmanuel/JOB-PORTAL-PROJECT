import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set auth header when token changes
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const res = await apiClient.get('/api/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session restoration failed:', err);
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete apiClient.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      const extractedToken = data.token;

      if (!extractedToken) {
        throw new Error('No token received from server.');
      }

      setToken(extractedToken);
      setUser(data);
      localStorage.setItem('token', extractedToken);
      localStorage.setItem('user', JSON.stringify(data));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${extractedToken}`;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (newToken) => {
    setLoading(true);
    try {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      const res = await apiClient.get('/api/auth/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    return await registerUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    loginWithToken,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};