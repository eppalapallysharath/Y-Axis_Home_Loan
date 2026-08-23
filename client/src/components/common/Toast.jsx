'use client';

import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const success = (msg) => toast.success(msg);
  const error = (msg) => toast.error(msg);
  const warning = (msg) => toast(msg, { icon: '⚠️' });
  const info = (msg) => toast(msg, { icon: 'ℹ️' });

  return (
    <ToastContext.Provider value={{ addToast: toast, removeToast: toast.dismiss, success, error, warning, info }}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
      warning: (msg) => toast(msg, { icon: '⚠️' }),
      info: (msg) => toast(msg, { icon: 'ℹ️' }),
      addToast: toast,
      removeToast: toast.dismiss,
    };
  }
  return context;
}

export default toast;

