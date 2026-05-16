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
  // ✅ FIX 1: loading starts false — there is no async init to wait for.
  // Previously it was never set to false, blocking the entire app forever
  // after a hard refresh when the user was already logged in.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginUser(credentials);

      // ✅ FIX 2: The backend returns { token, email, role, id, fullName }.
      // AuthResponse.role comes back as "ROLE_ADMIN" (from RoleEntity.getName()).
      // We store the full object so Login.jsx and ProtectedRoute can read data.role.
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
      {children}
    </AuthContext.Provider>
  );
};