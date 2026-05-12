import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there's a token but no user, we could theoretically fetch the user profile here.
    // However, the backend login response might not return user details, or we need an endpoint like /api/auth/me
    // Since we don't have a known /me endpoint, we will extract what we can or rely on login to set user.
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, you'd fetch the user profile here using the token
      setUser({ token }); 
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const receivedToken = data.token || data.accessToken || data.jwt || data; // fallback depending on actual AuthResponse structure
    
    // AuthResponse likely has token and role, we'll try to extract them
    let extractedToken = typeof receivedToken === 'string' ? receivedToken : (receivedToken.token || receivedToken.accessToken);
    
    setToken(extractedToken);
    localStorage.setItem('token', extractedToken);
    setUser(data);
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
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
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
