// src/components/Common/Toast.js
import React, { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const success = (message) => addToast(message, 'success');
  const error = (message) => addToast(message, 'error');
  const warning = (message) => addToast(message, 'warning');
  const info = (message) => addToast(message, 'info');

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '15px 25px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease',
              minWidth: '280px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: toast.type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' :
                         toast.type === 'error' ? 'linear-gradient(135deg, #dc3545, #e74c3c)' :
                         toast.type === 'warning' ? 'linear-gradient(135deg, #ffc107, #fd7e14)' :
                         'linear-gradient(135deg, #17a2b8, #007bff)'
            }}
          >
            <span style={{ fontSize: '20px' }}>
              {toast.type === 'success' ? '✓' :
               toast.type === 'error' ? '✕' :
               toast.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
