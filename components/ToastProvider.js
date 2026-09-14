'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './ToastProvider.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    // If type is not explicitly provided, try to infer it from the message
    let finalType = type;
    if (type === 'info') {
      const lowerMsg = String(message).toLowerCase();
      if (lowerMsg.includes('success') || lowerMsg.includes('saved')) {
        finalType = 'success';
      } else if (lowerMsg.includes('fail') || lowerMsg.includes('error') || lowerMsg.includes('invalid') || lowerMsg.includes('reject')) {
        finalType = 'error';
      }
    }

    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message: String(message), type: finalType }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Override window.alert globally to use our beautiful toast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg) => {
        showToast(msg);
      };
    }
  }, [showToast]);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={20} className={styles.iconSuccess} />;
      case 'error': return <AlertCircle size={20} className={styles.iconError} />;
      default: return <Info size={20} className={styles.iconInfo} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            <div className={styles.toastIconWrapper}>
              {getIcon(toast.type)}
            </div>
            <div className={styles.toastMessage}>
              {toast.message}
            </div>
            <button className={styles.toastCloseBtn} onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
            <div className={styles.progressBar} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
