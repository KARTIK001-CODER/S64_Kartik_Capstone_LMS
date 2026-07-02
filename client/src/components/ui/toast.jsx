import React, { createContext, useContext, useState, useCallback } from 'react'
import { cva } from 'class-variance-authority'

const toastVariants = cva([
  'fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-up',
  'min-w-[300px] max-w-[420px]',
], {
  variants: {
    variant: {
      default: 'bg-background border-border text-foreground',
      success: 'bg-success border-success/20 text-success-foreground',
      error: 'bg-error border-error/20 text-error-foreground',
      warning: 'bg-warning border-warning/20 text-warning-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, variant = 'default', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const toast = useCallback({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'default'),
  }, [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={toastVariants({ variant: t.variant })}>
            {t.variant === 'success' && (
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {t.variant === 'error' && (
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
