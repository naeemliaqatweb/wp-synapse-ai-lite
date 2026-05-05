import React, { useState, useEffect } from 'react';

const SettingsSkeleton = () => (
    <div style={{ padding: '20px', maxWidth: '850px', fontFamily: '"Inter", sans-serif', margin: '0 auto' }}>
        <div className="skeleton-box" style={{ width: '250px', height: '32px', marginBottom: '24px' }} />
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', height: '100px', marginBottom: '24px' }} className="skeleton-box" />
    </div>
);

function SettingsApp() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <SettingsSkeleton />;

    return (
        <div style={{ padding: '20px', maxWidth: '850px', fontFamily: '"Inter", sans-serif', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 24px 0', color: '#ffffff' }}>Synapse Lite Settings</h1>
            
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', padding: '40px', textAlign: 'center' }}>
               <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                   Core settings are managed by the main Synapse platform. No additional configuration is required for the Lite version at this time.
               </p>
            </div>
        </div>
    );
}

export default SettingsApp;
