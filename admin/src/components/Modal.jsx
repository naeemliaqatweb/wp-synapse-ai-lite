import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'OK', children, customFooter }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="modal-container"
            style={{ maxWidth: children ? '550px' : '400px' }}
          >
            <div className="modal-header" style={{ 
                backgroundColor: type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'transparent',
                borderBottom: type === 'info' ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {type === 'error' ? <AlertCircle size={20} color="#fff" /> : type === 'success' ? <CheckCircle size={20} color="#fff" /> : null}
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="modal-close-btn"
                style={{ color: (type === 'success' || type === 'error') ? '#fff' : 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {children ? (
                  children
              ) : (
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  {message}
                </p>
              )}
            </div>

            {customFooter === undefined ? (
                <div className="modal-footer">
                <button 
                    className="synapse-btn secondary" 
                    onClick={onClose}
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--border)' }}
                >
                    Cancel
                </button>
                <button 
                    className={`synapse-btn ${type === 'error' ? 'danger' : ''}`}
                    onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                    }}
                >
                    {confirmText}
                </button>
                </div>
            ) : customFooter}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
