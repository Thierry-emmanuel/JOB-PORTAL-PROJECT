import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const receivedToken = data.token || data.accessToken || data.jwt || data; 
    
    let extractedToken = typeof receivedToken === 'string' ? receivedToken : (receivedToken.token || receivedToken.accessToken);
    
    setToken(extractedToken);
    setUser(data);
    localStorage.setItem('token', extractedToken);
    localStorage.setItem('user', JSON.stringify(data));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${extractedToken}`;
    return data;
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
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
