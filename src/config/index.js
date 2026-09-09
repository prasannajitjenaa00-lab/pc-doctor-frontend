/**
 * Central Application Configuration
 * Aggregates, validates, and normalizes all environment variables
 */

const env = import.meta.env;

// Normalize base URLs by removing trailing slash if present
const sanitizeUrl = (url = '') => url.replace(/\/+$/, '');

export const config = {
  // API & Backend URLs
  apiBaseUrl: sanitizeUrl(env.VITE_API_BASE_URL || env.VITE_API_URL || '/api'),
  serverUrl: sanitizeUrl(env.VITE_SERVER_URL || 'http://localhost:5000'),

  // Environment & Security Flags
  isProduction: env.PROD || env.MODE === 'production',
  isDevelopment: env.DEV || env.MODE === 'development',
  isDemoLoginEnabled: env.VITE_ENABLE_DEMO_LOGIN === 'true' || (env.DEV && env.VITE_ENABLE_DEMO_LOGIN !== 'false'),

  // Branding & Regional Defaults
  appName: env.VITE_APP_NAME || 'PC Doctor',
  defaultCurrency: env.VITE_APP_CURRENCY || '₹',
  defaultCountryCode: env.VITE_DEFAULT_COUNTRY_CODE || '91',
  whatsAppBaseUrl: sanitizeUrl(env.VITE_WHATSAPP_BASE_URL || 'https://wa.me'),

  // Helpers for direct browser document downloads & static uploads
  endpoints: {
    billPdf: (id) => `${config.apiBaseUrl}/bills/${id}/pdf`,
    repairTokenPdf: (id) => `${config.apiBaseUrl}/repairs/${id}/token-pdf`,
    repairInvoicePdf: (id) => `${config.apiBaseUrl}/repairs/${id}/invoice-pdf`,
    salesExcel: () => `${config.apiBaseUrl}/reports/export/sales-excel`,
    inventoryExcel: () => `${config.apiBaseUrl}/reports/export/inventory-excel`,
    assetUrl: (path) => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${config.serverUrl}${cleanPath}`;
    }
  }
};

export default config;
