import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { config } from '../config';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [shopSettings, setShopSettings] = useState({
    shopName: config.appName,
    tagline: 'Computer, Laptop, CCTV & Networking Solutions',
    phone: '+91 98765 43210',
    email: 'contact@pcdoctor.com',
    address: 'Shop #12, Tech Plaza',
    city: 'City',
    state: 'State',
    pincode: '751001',
    gstNumber: '',
    invoicePrefix: 'INV',
    repairPrefix: 'REP',
    currencySymbol: config.defaultCurrency,
    themeColor: '#2563eb',
    defaultGstRate: 18
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('pc_doctor_theme') === 'dark' ||
      (!('pc_doctor_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [loading, setLoading] = useState(true);

  // Sync dark mode class to <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pc_doctor_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pc_doctor_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Fetch settings from server
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data) {
        setShopSettings(res.data);
      }
    } catch (err) {
      console.warn('Using default shop settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ShopContext.Provider
      value={{
        shopSettings,
        setShopSettings,
        refreshSettings: fetchSettings,
        isDarkMode,
        toggleDarkMode,
        loading
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
