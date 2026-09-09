import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30 // 30 seconds cache
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '0.75rem',
                border: '1px solid #334155',
                fontSize: '0.875rem'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f8fafc'
                }
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f8fafc'
                }
              }
            }}
          />
          </BrowserRouter>
        </AuthProvider>
      </ShopProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
