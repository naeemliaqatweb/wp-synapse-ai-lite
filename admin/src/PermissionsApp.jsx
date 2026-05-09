import React from 'react';
import PermissionsTool from './components/PermissionsTool';

const PermissionsApp = () => {
    return (
        <div style={{ padding: '40px', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 10px 0', color: '#fff' }}>Permissions Manager</h1>
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Resolve file write permission issues for seamless theme and plugin development.</p>
                </div>

                <div style={{ background: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                    <PermissionsTool />
                </div>
            </div>
        </div>
    );
};

export default PermissionsApp;
