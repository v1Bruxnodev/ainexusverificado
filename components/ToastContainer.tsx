import React, { useContext } from 'react';
import { InternalToastContext } from '../contexts/ToastContext';
import { ToastType, type ToastMessage } from '../types';

const ICONS: Record<ToastType, React.ReactNode> = {
    [ToastType.SUCCESS]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    [ToastType.ERROR]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    [ToastType.INFO]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    return (
        <div 
            className="w-full max-w-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border border-gray-300 dark:border-white/10 rounded-lg shadow-2xl flex items-center p-4 space-x-4 pointer-events-auto"
            style={{ animation: 'toast-in 0.5s ease-out forwards' }}
            role="alert"
        >
            <div className="flex-shrink-0">{ICONS[toast.type]}</div>
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{toast.message}</p>
            <button onClick={() => onDismiss(toast.id)} className="p-1 rounded-full text-gray-500 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Fechar notificação">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};


const ToastContainer: React.FC = () => {
    const context = useContext(InternalToastContext);

    if (!context) return null;

    const { toasts, removeToast } = context;

    return (
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-3 pointer-events-none">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onDismiss={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;