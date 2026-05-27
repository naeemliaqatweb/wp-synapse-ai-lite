import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle size={18} style={{ color: '#10b981' }} />,
        error: <AlertCircle size={18} style={{ color: '#ef4444' }} />,
        info: <Info size={18} style={{ color: '#3b82f6' }} />,
        warning: <AlertCircle size={18} style={{ color: '#f59e0b' }} />
    };

    const colors = {
        success: 'rgba(16, 185, 129, 0.1)',
        error: 'rgba(239, 68, 68, 0.1)',
        info: 'rgba(59, 130, 246, 0.1)',
        warning: 'rgba(245, 158, 11, 0.1)'
    };

    const borders = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 10000,
                background: 'var(--bg-secondary)',
                border: `1px solid ${borders[type]}55`,
                borderLeft: `4px solid ${borders[type]}`,
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '400px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icons[type]}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                    {message}
                </p>
            </div>
            <button 
                onClick={onClose}
                style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '4px', 
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};

export default Toast;
