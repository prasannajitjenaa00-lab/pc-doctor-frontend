import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { config } from '../config';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'pc_doctor_token';
const STORAGE_USER_KEY = 'pc_doctor_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on initial boot
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      const savedUserStr = localStorage.getItem(STORAGE_USER_KEY);

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setUser(parsedUser);
        setToken(savedToken);
      }
    } catch (err) {
      console.warn('Failed to parse saved user credentials:', err);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log in with username/email and password
   */
  const login = async ({ username, password }) => {
    try {
      const res = await api.post('/auth/login', { username, password });

      if (res && res.success && res.data) {
        const { user: userData, token: userToken } = res.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem(STORAGE_TOKEN_KEY, userToken);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
        return { success: true, user: userData };
      }

      throw new Error(res?.message || 'Login failed');
    } catch (error) {
      // Offline / fallback demo login support (only if enabled via config)
      if (config.isDemoLoginEnabled) {
        const trimmedUser = username.trim().toLowerCase();
        if ((trimmedUser === 'admin' || trimmedUser === 'admin@pcdoctor.com') && password === 'admin123') {
          const demoUser = {
            id: 'demo-admin-id',
            name: 'Dr. PC Admin',
            username: 'admin',
            email: 'admin@pcdoctor.com',
            role: 'admin',
            lastLogin: new Date().toISOString()
          };
          const demoToken = 'demo-session-token-' + Date.now();

          setUser(demoUser);
          setToken(demoToken);
          localStorage.setItem(STORAGE_TOKEN_KEY, demoToken);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(demoUser));
          return { success: true, user: demoUser };
        }
      }

      const message = error.response?.data?.message || error.message || 'Invalid username or password';
      throw new Error(message);
    }
  };

  /**
   * Log out current user
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore API errors on logout
    } finally {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
