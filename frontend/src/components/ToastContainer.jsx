import React from 'react';
import useToastStore from '../stores/toastStore';

const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500',
};

const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top, 16px))',
            right: '16px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '360px',
            width: 'calc(100vw - 32px)',
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={typeStyles[toast.type] || typeStyles.info}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        animation: 'toastFadeInUp 0.3s ease-out',
                        cursor: 'pointer',
                    }}
                    onClick={() => removeToast(toast.id)}
                >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>
                        {typeIcons[toast.type] || typeIcons.info}
                    </span>
                    <span style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;
