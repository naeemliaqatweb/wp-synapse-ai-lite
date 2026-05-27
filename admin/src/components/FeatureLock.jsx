import React from 'react';

const FeatureLock = ({ children, isLocked, featureName }) => {
    if (!isLocked) return children;

    return (
        <div className="feature-lock-container" style={{ position: 'relative' }}>
            <div className="feature-content-locked" style={{ opacity: 0.5, pointerEvents: 'none', filter: 'blur(1px)' }}>
                {children}
            </div>
            <div className="feature-lock-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                backdropFilter: 'blur(2px)',
                border: '1px dashed var(--border)',
                zIndex: 10
            }}>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    textAlign: 'center',
                    border: '1px solid var(--accent)'
                }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '4px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Pro Feature</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '8px' }}>
                        Unlock {featureName} with Synapse Pro
                    </div>
                    <a 
                        href={window.wpSynapseAI?.upgradeUrl || '#'}
                        target="_top"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: '#fff',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                    >
                        Upgrade to Pro
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FeatureLock;
