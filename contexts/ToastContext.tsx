import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { ToastMessage } from '../types';
import { ToastType } from '../types';

interface ToastContextValue {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const InternalToastContext = createContext<{
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
} | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast deve ser usado dentro de um ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = ToastType.INFO) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 5000); // Auto-dismiss after 5 seconds
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            <InternalToastContext.Provider value={{ toasts, removeToast }}>
                {children}
            </InternalToastContext.Provider>
        </ToastContext.Provider>
    );
};
